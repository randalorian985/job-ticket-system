using System.Net;
using System.Net.Mail;
using System.Text;
using JobTicketSystem.Application.CompanyConfiguration;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace JobTicketSystem.Application.Notifications;

public interface IPartOrderRequestNotificationService
{
    Task NotifyRequestedAsync(Guid jobTicketPartId, CancellationToken cancellationToken = default);
}

public sealed class PartOrderRequestNotificationService(
    ApplicationDbContext dbContext,
    ICompanyConfigurationService companyConfigurationService,
    IOptions<SmtpEmailSettings> smtpOptions) : IPartOrderRequestNotificationService
{
    public async Task NotifyRequestedAsync(Guid jobTicketPartId, CancellationToken cancellationToken = default)
    {
        var settings = smtpOptions.Value;
        if (!settings.Enabled || string.IsNullOrWhiteSpace(settings.Host))
        {
            return;
        }

        var configuration = await companyConfigurationService.GetAsync(cancellationToken);
        var recipient = Normalize(configuration.PartOrderRequestsEmail ?? configuration.Email);
        if (recipient is null)
        {
            return;
        }

        var part = await dbContext.JobTicketParts
            .Include(x => x.JobTicket)
            .SingleOrDefaultAsync(x => x.Id == jobTicketPartId, cancellationToken);

        if (part is null || !part.OfficeOrderRequested)
        {
            return;
        }

        var subject = $"Part order request for {part.JobTicket.TicketNumber}";
        var body = BuildBody(part);

        using var message = new MailMessage(settings.FromAddress ?? recipient, recipient, subject, body)
        {
            IsBodyHtml = false
        };

        using var client = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(settings.Username, settings.Password)
        };

        await client.SendMailAsync(message, cancellationToken);
    }

    private static string BuildBody(JobTicketPart part)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"Job ticket: {part.JobTicket.TicketNumber} - {part.JobTicket.Title}");
        builder.AppendLine($"Part: {part.PartNumberSnapshot} - {part.PartNameSnapshot}");
        builder.AppendLine($"Quantity: {part.Quantity}");
        if (!string.IsNullOrWhiteSpace(part.OfficeOrderNotes))
        {
            builder.AppendLine();
            builder.AppendLine("Office order notes:");
            builder.AppendLine(part.OfficeOrderNotes);
        }

        return builder.ToString();
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed record SmtpEmailSettings(
    bool Enabled,
    string? Host,
    int Port,
    bool EnableSsl,
    string? Username,
    string? Password,
    string? FromAddress);