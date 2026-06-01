using JobTicketSystem.Application.Auth;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class UsersServiceTests
{
    [Fact]
    public async Task Create_normalizes_username_and_email_before_save()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var created = await service.CreateAsync(new CreateUserDto(
            "  technician.one  ",
            "  tech.one@example.test  ",
            "  Tech  ",
            "  One  ",
            SystemRoles.Employee,
            "Password123!"));

        var employee = await context.Employees.SingleAsync(x => x.Id == created.Id);
        Assert.Equal("technician.one", employee.UserName);
        Assert.Equal("tech.one@example.test", employee.Email);
        Assert.Equal("Tech", employee.FirstName);
        Assert.Equal("One", employee.LastName);
    }

    [Fact]
    public async Task Create_rejects_duplicate_username_after_normalization()
    {
        await using var context = CreateContext();
        SeedEmployee(context, userName: "technician.one", email: "one@example.test");
        await context.SaveChangesAsync();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateUserDto(
            "  TECHNICIAN.ONE  ",
            "two@example.test",
            "Tech",
            "Two",
            SystemRoles.Employee,
            "Password123!")));
    }

    [Fact]
    public async Task Create_rejects_duplicate_email_after_normalization()
    {
        await using var context = CreateContext();
        SeedEmployee(context, userName: "technician.one", email: "tech.one@example.test");
        await context.SaveChangesAsync();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateUserDto(
            "technician.two",
            "  TECH.ONE@EXAMPLE.TEST  ",
            "Tech",
            "Two",
            SystemRoles.Employee,
            "Password123!")));
    }

    [Fact]
    public async Task Update_allows_same_user_normalized_username_and_email()
    {
        await using var context = CreateContext();
        var employee = SeedEmployee(context, userName: "technician.one", email: "tech.one@example.test");
        await context.SaveChangesAsync();
        var service = CreateService(context);

        var updated = await service.UpdateAsync(employee.Id, new UpdateUserDto(
            "  TECHNICIAN.ONE  ",
            "  TECH.ONE@EXAMPLE.TEST  ",
            "  Tech  ",
            "  One  ",
            SystemRoles.Employee));

        Assert.NotNull(updated);
        Assert.Equal("TECHNICIAN.ONE", updated.UserName);
        Assert.Equal("TECH.ONE@EXAMPLE.TEST", updated.Email);
    }

    [Fact]
    public async Task Update_rejects_duplicate_username_from_another_user_after_normalization()
    {
        await using var context = CreateContext();
        SeedEmployee(context, userName: "technician.one", email: "tech.one@example.test");
        var employee = SeedEmployee(context, userName: "technician.two", email: "tech.two@example.test");
        await context.SaveChangesAsync();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(employee.Id, new UpdateUserDto(
            "  TECHNICIAN.ONE  ",
            "tech.two@example.test",
            "Tech",
            "Two",
            SystemRoles.Employee)));
    }

    [Fact]
    public async Task Update_rejects_duplicate_email_from_another_user_after_normalization()
    {
        await using var context = CreateContext();
        SeedEmployee(context, userName: "technician.one", email: "tech.one@example.test");
        var employee = SeedEmployee(context, userName: "technician.two", email: "tech.two@example.test");
        await context.SaveChangesAsync();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ValidationException>(() => service.UpdateAsync(employee.Id, new UpdateUserDto(
            "technician.two",
            "  TECH.ONE@EXAMPLE.TEST  ",
            "Tech",
            "Two",
            SystemRoles.Employee)));
    }

    private static UsersService CreateService(ApplicationDbContext context)
    {
        var authService = new AuthService(context, new TestCurrentUserContext(Guid.NewGuid(), SystemRoles.Admin));
        return new UsersService(context, authService);
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static Employee SeedEmployee(ApplicationDbContext context, string userName, string email)
    {
        var employee = new Employee
        {
            FirstName = "Existing",
            LastName = "User",
            UserName = userName,
            Email = email,
            PasswordHash = "hash",
            Role = SystemRoles.Employee,
            Status = EmployeeStatus.Active
        };
        context.Employees.Add(employee);
        return employee;
    }
}
