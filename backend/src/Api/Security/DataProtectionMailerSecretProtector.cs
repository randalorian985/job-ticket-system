using JobTicketSystem.Application.Notifications;
using Microsoft.AspNetCore.DataProtection;

namespace JobTicketSystem.Api.Security;

public sealed class DataProtectionMailerSecretProtector(IDataProtectionProvider dataProtectionProvider) : IMailerSecretProtector
{
    private readonly IDataProtector protector = dataProtectionProvider.CreateProtector("JobTicketSystem.MailerConfiguration.v1");

    public string Protect(string value) => protector.Protect(value);

    public string Unprotect(string protectedValue) => protector.Unprotect(protectedValue);
}
