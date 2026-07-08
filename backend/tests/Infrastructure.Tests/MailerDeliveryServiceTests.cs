using System.Net;
using JobTicketSystem.Application.Notifications;
using JobTicketSystem.Domain.Enums;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class MailerDeliveryServiceTests
{
    [Fact]
    public async Task SendAsync_for_microsoft365_requests_token_and_sends_mail_with_graph()
    {
        var handler = new CapturingHttpMessageHandler((request, _) =>
        {
            if (request.RequestUri?.Host == "login.microsoftonline.com")
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"access_token":"token-123"}""")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.Accepted);
        });
        var service = new MailerDeliveryService(new HttpClient(handler));
        var settings = new ResolvedMailerSettings(
            Provider: MailerProvider.Microsoft365,
            Enabled: true,
            IsConfigured: true,
            FromName: "Dispatch",
            FromAddress: "dispatch@example.com",
            ReplyToAddress: "office@example.com",
            Host: null,
            Port: 587,
            EnableSsl: true,
            Username: null,
            Password: null,
            AppBaseUrl: "https://dev.mudbugdigital.com",
            ConfigurationSource: "Database",
            Microsoft365TenantId: "contoso.onmicrosoft.com",
            Microsoft365ClientId: "00000000-0000-0000-0000-000000000000",
            Microsoft365ClientSecret: "graph-secret",
            Microsoft365SenderEmail: "dispatch@example.com");

        await service.SendAsync(settings, "owner@example.com", "Test subject", "Test body");

        Assert.Collection(
            handler.Requests,
            tokenRequest =>
            {
                Assert.Equal(HttpMethod.Post, tokenRequest.Method);
                Assert.Equal("https://login.microsoftonline.com/contoso.onmicrosoft.com/oauth2/v2.0/token", tokenRequest.Uri);
                Assert.Contains("grant_type=client_credentials", tokenRequest.Content);
                Assert.Contains("client_id=00000000-0000-0000-0000-000000000000", tokenRequest.Content);
            },
            mailRequest =>
            {
                Assert.Equal(HttpMethod.Post, mailRequest.Method);
                Assert.Equal("https://graph.microsoft.com/v1.0/users/dispatch%40example.com/sendMail", mailRequest.Uri);
                Assert.Equal("Bearer", mailRequest.AuthorizationScheme);
                Assert.Equal("token-123", mailRequest.AuthorizationParameter);
                Assert.Contains("owner@example.com", mailRequest.Content);
                Assert.Contains("Test subject", mailRequest.Content);
                Assert.Contains("office@example.com", mailRequest.Content);
            });
    }

    private sealed class CapturingHttpMessageHandler(
        Func<HttpRequestMessage, string?, HttpResponseMessage> responder) : HttpMessageHandler
    {
        public List<CapturedRequest> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var content = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            Requests.Add(new CapturedRequest(
                request.Method,
                request.RequestUri?.ToString() ?? string.Empty,
                content ?? string.Empty,
                request.Headers.Authorization?.Scheme,
                request.Headers.Authorization?.Parameter));

            return responder(request, content);
        }
    }

    private sealed record CapturedRequest(
        HttpMethod Method,
        string Uri,
        string Content,
        string? AuthorizationScheme,
        string? AuthorizationParameter);
}
