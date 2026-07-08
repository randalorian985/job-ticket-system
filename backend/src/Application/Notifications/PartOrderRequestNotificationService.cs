using System.Text;
using JobTicketSystem.Application.CompanyConfiguration;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Notifications;

public interface IPartOrderRequestNotificationService
{
    Task NotifyRequestedAsync(Guid jobTicketPartId, CancellationToken cancellationToken = default);
}

public sealed class PartOrderRequestNotificationService(
    ApplicationDbContext dbContext,
    ICompanyConfigurationService companyConfigurationService,
    IMailerConfigurationService mailerConfigurationService,
    IMailerDeliveryService mailerDeliveryService) : IPartOrderRequestNotificationService
{
    public async Task NotifyRequestedAsync(Guid jobTicketPartId, CancellationToken cancellationToken = default)
    {
        var settings = await mailerConfigurationService.GetResolvedSettingsAsync(cancellationToken);
        if (!settings.Enabled || !settings.IsConfigured)
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

        await mailerDeliveryService.SendAsync(settings, recipient, subject, body, cancellationToken);
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
    string? FromAddress,
    string? AppBaseUrl);
