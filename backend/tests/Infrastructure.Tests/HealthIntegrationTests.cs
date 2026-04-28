using System.Net;
using System.Text.Json;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class HealthIntegrationTests
{
    [Fact]
    public async Task Health_endpoint_returns_json_payload_with_status()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("application/json", response.Content.Headers.ContentType?.MediaType, StringComparison.OrdinalIgnoreCase);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        Assert.True(json.RootElement.TryGetProperty("status", out var statusProperty));
        Assert.False(string.IsNullOrWhiteSpace(statusProperty.GetString()));
    }
}
