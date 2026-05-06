using System.Net;
using System.Text.Json;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class HealthIntegrationTests
{
    [Fact]
    public async Task Health_endpoint_returns_healthy_json_payload_without_authentication()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("application/json", response.Content.Headers.ContentType?.MediaType, StringComparison.OrdinalIgnoreCase);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Object, json.RootElement.ValueKind);

        Assert.True(json.RootElement.TryGetProperty("status", out var statusProperty));
        Assert.Equal(JsonValueKind.String, statusProperty.ValueKind);
        Assert.False(string.IsNullOrWhiteSpace(statusProperty.GetString()));

        Assert.True(json.RootElement.TryGetProperty("totalDuration", out var totalDurationProperty));
        Assert.True(totalDurationProperty.ValueKind is JsonValueKind.String or JsonValueKind.Number);

        Assert.True(json.RootElement.TryGetProperty("entries", out var entriesProperty));
        Assert.Equal(JsonValueKind.Object, entriesProperty.ValueKind);
    }

    [Fact]
    public async Task System_info_endpoint_returns_foundational_metadata_without_authentication()
    {
        await using var factory = new TestApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/system/info");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("application/json", response.Content.Headers.ContentType?.MediaType, StringComparison.OrdinalIgnoreCase);

        var body = await response.Content.ReadAsStringAsync();
        using var json = JsonDocument.Parse(body);

        Assert.Equal("Job Ticket Management System API", json.RootElement.GetProperty("serviceName").GetString());
        Assert.Equal("/api", json.RootElement.GetProperty("apiBasePath").GetString());
        Assert.Equal("/health", json.RootElement.GetProperty("healthEndpoint").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.RootElement.GetProperty("environmentName").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(json.RootElement.GetProperty("version").GetString()));
    }
}
