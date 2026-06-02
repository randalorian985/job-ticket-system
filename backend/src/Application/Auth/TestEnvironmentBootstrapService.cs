using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Auth;

public interface ITestEnvironmentBootstrapService
{
    Task<TestEnvironmentBootstrapSummaryDto> EnsureAsync(TestEnvironmentBootstrapSettings settings, CancellationToken cancellationToken = default);
}

public sealed class TestEnvironmentBootstrapService(ApplicationDbContext dbContext, IAuthService authService) : ITestEnvironmentBootstrapService
{
    public const string DefaultAdminUserName = "test.admin";
    public const string DefaultAdminEmail = "test.admin@example.local";
    public const string DefaultAdminPassword = "TestAdmin123!";

    public async Task<TestEnvironmentBootstrapSummaryDto> EnsureAsync(TestEnvironmentBootstrapSettings settings, CancellationToken cancellationToken = default)
    {
        var adminExists = await dbContext.Employees
            .AnyAsync(x => x.Role == SystemRoles.Admin && x.Status == EmployeeStatus.Active, cancellationToken);

        if (adminExists)
        {
            return new TestEnvironmentBootstrapSummaryDto(false, settings.AdminUserName, settings.AdminEmail, SystemRoles.Admin, SystemRoles.All);
        }

        var userName = NormalizeRequired(settings.AdminUserName, nameof(settings.AdminUserName));
        var email = NormalizeRequired(settings.AdminEmail, nameof(settings.AdminEmail));
        var firstName = NormalizeRequired(settings.AdminFirstName, nameof(settings.AdminFirstName));
        var lastName = NormalizeRequired(settings.AdminLastName, nameof(settings.AdminLastName));
        var password = NormalizeRequired(settings.AdminPassword, nameof(settings.AdminPassword));
        var normalizedUserName = userName.ToUpperInvariant();
        var normalizedEmail = email.ToUpperInvariant();

        var conflictsWithExistingUser = await dbContext.Employees
            .IgnoreQueryFilters()
            .AnyAsync(
                x =>
                    (x.UserName != null && x.UserName.ToUpper() == normalizedUserName) ||
                    (x.Email != null && x.Email.ToUpper() == normalizedEmail),
                cancellationToken);

        if (conflictsWithExistingUser)
        {
            throw new InvalidOperationException("Test bootstrap admin credentials conflict with an existing non-admin employee record.");
        }

        var admin = new Employee
        {
            FirstName = firstName,
            LastName = lastName,
            UserName = userName,
            Email = email,
            Role = SystemRoles.Admin,
            PasswordHash = authService.HashPassword(password),
            Status = EmployeeStatus.Active
        };

        dbContext.Employees.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new TestEnvironmentBootstrapSummaryDto(true, userName, email, SystemRoles.Admin, SystemRoles.All);
    }

    private static string NormalizeRequired(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"{fieldName} is required when TestBootstrap is enabled.");
        }

        return value.Trim();
    }
}

public sealed record TestEnvironmentBootstrapSettings(
    string AdminUserName = TestEnvironmentBootstrapService.DefaultAdminUserName,
    string AdminEmail = TestEnvironmentBootstrapService.DefaultAdminEmail,
    string AdminPassword = TestEnvironmentBootstrapService.DefaultAdminPassword,
    string AdminFirstName = "Test",
    string AdminLastName = "Admin");

public sealed record TestEnvironmentBootstrapSummaryDto(
    bool Created,
    string AdminUserName,
    string AdminEmail,
    string AdminRole,
    IReadOnlyList<string> AvailableRoles);
