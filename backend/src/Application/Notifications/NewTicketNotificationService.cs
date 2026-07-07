using System.Net;
using System.Net.Mail;
using System.Text;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace JobTicketSystem.Application.Notifications;

public interface INewTicketNotificationService
{
    Task NotifyAsync(Guid jobTicketId, CancellationToken cancellationToken = default);
}

public sealed class NewTicketNotificationService(
    ApplicationDbContext dbContext,
    IMailerConfigurationService mailerConfigurationService,
    ILogger<NewTicketNotificationService> logger) : INewTicketNotificationService
{
    public async Task NotifyAsync(Guid jobTicketId, CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await mailerConfigurationService.GetResolvedSettingsAsync(cancellationToken);
            if (!settings.Enabled || !settings.IsConfigured)
            {
                return;
            }

            var config = await dbContext.CompanyConfigurations
                .FirstOrDefaultAsync(cancellationToken);

            if (config is null || !config.NewTicketNotificationsEnabled)
            {
                return;
            }

            var recipients = await dbContext.NewTicketNotificationRecipients
                .Where(r => r.IsActive)
                .ToListAsync(cancellationToken);

            if (recipients.Count == 0)
            {
                return;
            }

            var ticket = await dbContext.JobTickets
                .Include(t => t.Customer)
                .Include(t => t.ServiceLocation)
                .Include(t => t.Equipment)
                .SingleOrDefaultAsync(t => t.Id == jobTicketId, cancellationToken);

            if (ticket is null)
            {
                return;
            }

            if ((int)ticket.Priority < config.NewTicketNotificationMinimumPriority)
            {
                return;
            }

            var notifiedEmails = new List<string>();

            foreach (var recipient in recipients)
            {
                var recipientEmail = NormalizeEmail(recipient.Email);
                if (recipientEmail is null)
                {
                    continue;
                }

                try
                {
                    var subject = BuildSubject(ticket);
                    var body = BuildBody(ticket, settings);

                    using var message = MailerConfigurationService.CreateMessage(settings, recipientEmail, subject, body);
                    using var client = CreateSmtpClient(settings);

                    await client.SendMailAsync(message, cancellationToken);
                    notifiedEmails.Add(recipientEmail);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to send new ticket notification to {Email} for ticket {TicketId}", recipientEmail, jobTicketId);
                }
            }

            if (notifiedEmails.Count > 0)
            {
                var timelineNote = notifiedEmails.Count == 1
                    ? $"New ticket notification sent to {notifiedEmails[0]}."
                    : $"New ticket notification sent to {notifiedEmails.Count} recipients: {string.Join(", ", notifiedEmails)}.";

                dbContext.JobWorkEntries.Add(new JobWorkEntry
                {
                    JobTicketId = jobTicketId,
                    EntryType = WorkEntryType.Note,
                    Notes = timelineNote,
                    PerformedAtUtc = DateTime.UtcNow
                });

                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "New ticket notification failed for ticket {TicketId}", jobTicketId);
        }
    }

    private static string BuildSubject(JobTicket ticket)
    {
        var priority = ticket.Priority switch
        {
            JobTicketPriority.Low => "Low",
            JobTicketPriority.Normal => "Normal",
            JobTicketPriority.High => "High",
            JobTicketPriority.Urgent => "Urgent",
            _ => ticket.Priority.ToString()
        };

        var location = ticket.ServiceLocation?.LocationName ?? ticket.Customer?.Name ?? "Unknown";
        return $"[{priority}] New Ticket: {ticket.Title} — {ticket.Customer?.Name ?? "Unknown"} / {location}";
    }

    private static string BuildBody(JobTicket ticket, ResolvedMailerSettings settings)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"A new service ticket has been submitted.");
        builder.AppendLine();
        builder.AppendLine($"Ticket:   {ticket.TicketNumber}");
        builder.AppendLine($"Title:    {ticket.Title}");
        builder.AppendLine($"Priority: {ticket.Priority}");
        builder.AppendLine($"Status:   {ticket.Status}");

        if (ticket.Customer is not null)
        {
            builder.AppendLine($"Customer: {ticket.Customer.Name}");
        }

        if (ticket.ServiceLocation is not null)
        {
            builder.AppendLine($"Location: {ticket.ServiceLocation.LocationName}");
        }

        if (ticket.Equipment is not null)
        {
            builder.AppendLine($"Equipment: {ticket.Equipment.Name}");
        }

        if (!string.IsNullOrWhiteSpace(ticket.Description))
        {
            builder.AppendLine();
            builder.AppendLine("Description:");
            builder.AppendLine(ticket.Description);
        }

        var baseUrl = !string.IsNullOrWhiteSpace(settings.AppBaseUrl)
            ? settings.AppBaseUrl.TrimEnd('/')
            : null;

        if (baseUrl is not null)
        {
            builder.AppendLine();
            builder.AppendLine($"View ticket: {baseUrl}/manage/job-tickets/{ticket.Id}");
        }

        return builder.ToString();
    }

    private static SmtpClient CreateSmtpClient(ResolvedMailerSettings settings)
    {
        return new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(settings.Username, settings.Password)
        };
    }

    private static string? NormalizeEmail(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
