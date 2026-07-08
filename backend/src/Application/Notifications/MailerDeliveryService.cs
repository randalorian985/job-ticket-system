using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Text.Json;
using JobTicketSystem.Domain.Enums;

namespace JobTicketSystem.Application.Notifications;

public interface IMailerDeliveryService
{
    Task SendAsync(
        ResolvedMailerSettings settings,
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default);
}

public sealed class MailerDeliveryService(HttpClient httpClient) : IMailerDeliveryService
{
    private const string GraphScope = "https://graph.microsoft.com/.default";

    public async Task SendAsync(
        ResolvedMailerSettings settings,
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (!settings.Enabled || !settings.IsConfigured)
        {
            throw new InvalidOperationException("Outgoing mail is not configured.");
        }

        if (settings.Provider == MailerProvider.Microsoft365)
        {
            await SendMicrosoft365GraphAsync(settings, recipientEmail, subject, body, cancellationToken);
            return;
        }

        using var message = MailerConfigurationService.CreateMessage(settings, recipientEmail, subject, body);
        using var client = CreateSmtpClient(settings);

        await client.SendMailAsync(message, cancellationToken);
    }

    private async Task SendMicrosoft365GraphAsync(
        ResolvedMailerSettings settings,
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var token = await GetMicrosoft365AccessTokenAsync(settings, cancellationToken);
        var sender = Required(settings.Microsoft365SenderEmail, "Microsoft365SenderEmail");
        var requestUri = $"https://graph.microsoft.com/v1.0/users/{Uri.EscapeDataString(sender)}/sendMail";

        var message = new Dictionary<string, object?>
        {
            ["subject"] = subject,
            ["body"] = new
            {
                contentType = "Text",
                content = body
            },
            ["toRecipients"] = new[]
            {
                new
                {
                    emailAddress = new
                    {
                        address = recipientEmail
                    }
                }
            }
        };

        if (!string.IsNullOrWhiteSpace(settings.ReplyToAddress))
        {
            message["replyTo"] = new[]
            {
                new
                {
                    emailAddress = new
                    {
                        address = settings.ReplyToAddress
                    }
                }
            };
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = JsonContent.Create(new
            {
                message,
                saveToSentItems = true
            })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Microsoft 365 sendMail failed: {BuildErrorMessage(response, content)}");
        }
    }

    private async Task<string> GetMicrosoft365AccessTokenAsync(
        ResolvedMailerSettings settings,
        CancellationToken cancellationToken)
    {
        var tenantId = Required(settings.Microsoft365TenantId, "Microsoft365TenantId");
        var clientId = Required(settings.Microsoft365ClientId, "Microsoft365ClientId");
        var clientSecret = Required(settings.Microsoft365ClientSecret, "Microsoft365ClientSecret");
        var requestUri = $"https://login.microsoftonline.com/{Uri.EscapeDataString(tenantId)}/oauth2/v2.0/token";

        using var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["scope"] = GraphScope,
            ["grant_type"] = "client_credentials"
        });

        using var response = await httpClient.PostAsync(requestUri, requestBody, cancellationToken);
        var content = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Microsoft 365 token request failed: {BuildErrorMessage(response, content)}");
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("access_token", out var tokenElement))
        {
            throw new InvalidOperationException("Microsoft 365 token response did not include an access token.");
        }

        var token = tokenElement.GetString();
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("Microsoft 365 token response included an empty access token.");
        }

        return token;
    }

    private static SmtpClient CreateSmtpClient(ResolvedMailerSettings settings)
    {
        return new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            Timeout = 10_000,
            Credentials = string.IsNullOrWhiteSpace(settings.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(settings.Username, settings.Password)
        };
    }

    private static string Required(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{fieldName} is required.");
        }

        return value.Trim();
    }

    private static string BuildErrorMessage(HttpResponseMessage response, string content)
    {
        var parsedMessage = TryParseMicrosoftErrorMessage(content);
        var detail = string.IsNullOrWhiteSpace(parsedMessage)
            ? content
            : parsedMessage;

        if (string.IsNullOrWhiteSpace(detail))
        {
            return $"{(int)response.StatusCode} {response.ReasonPhrase}";
        }

        return $"{(int)response.StatusCode} {response.ReasonPhrase}: {detail}";
    }

    private static string? TryParseMicrosoftErrorMessage(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(content);
            if (document.RootElement.TryGetProperty("error_description", out var description))
            {
                return description.GetString();
            }

            if (document.RootElement.TryGetProperty("error", out var error))
            {
                if (error.ValueKind == JsonValueKind.String)
                {
                    return error.GetString();
                }

                if (error.TryGetProperty("message", out var message))
                {
                    return message.GetString();
                }
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }
}
