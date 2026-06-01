using JobTicketSystem.Api.Auth;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class JwtSettingsValidatorTests
{
    [Theory]
    [InlineData("", "JobTicketSystem.Api", "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890", 120, "Jwt:Issuer")]
    [InlineData("JobTicketSystem", "", "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890", 120, "Jwt:Audience")]
    [InlineData("JobTicketSystem", "JobTicketSystem.Api", "too-short", 120, "Jwt:SigningKey")]
    [InlineData("JobTicketSystem", "JobTicketSystem.Api", "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890", 0, "Jwt:ExpirationMinutes")]
    public void Validate_rejects_invalid_settings(string issuer, string audience, string signingKey, int expirationMinutes, string expectedMessagePart)
    {
        var settings = new JwtSettings
        {
            Issuer = issuer,
            Audience = audience,
            SigningKey = signingKey,
            ExpirationMinutes = expirationMinutes
        };

        var exception = Assert.Throws<InvalidOperationException>(() => JwtSettingsValidator.Validate(settings));
        Assert.Contains(expectedMessagePart, exception.Message);
    }

    [Fact]
    public void Validate_accepts_complete_settings()
    {
        var settings = new JwtSettings
        {
            Issuer = "JobTicketSystem",
            Audience = "JobTicketSystem.Api",
            SigningKey = "PLEASE_CHANGE_THIS_DEVELOPMENT_KEY_1234567890",
            ExpirationMinutes = 120
        };

        JwtSettingsValidator.Validate(settings);
    }
}
