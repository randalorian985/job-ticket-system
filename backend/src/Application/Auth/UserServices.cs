using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Domain.Entities;
using JobTicketSystem.Domain.Enums;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Auth;

public interface IUsersService
{
    Task<IReadOnlyList<UserDto>> ListAsync(CancellationToken cancellationToken = default);
    Task<UserDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(CreateUserDto request, CancellationToken cancellationToken = default);
    Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto request, CancellationToken cancellationToken = default);
    Task<UserDto?> ArchiveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto?> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default);
}

public sealed class UsersService(ApplicationDbContext dbContext, IAuthService authService) : IUsersService
{
    public async Task<IReadOnlyList<UserDto>> ListAsync(CancellationToken cancellationToken = default)
        => await dbContext.Employees.OrderBy(x => x.LastName).ThenBy(x => x.FirstName).Select(MapUser).ToListAsync(cancellationToken);

    public Task<UserDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
        => dbContext.Employees.Where(x => x.Id == id).Select(MapUser).SingleOrDefaultAsync(cancellationToken);

    public async Task<UserDto> CreateAsync(CreateUserDto request, CancellationToken cancellationToken = default)
    {
        ValidateRole(request.Role);
        ValidationHelpers.ValidateRequired(request.Password, nameof(request.Password));

        var userName = request.UserName.Trim();
        if (await dbContext.Employees.AnyAsync(x => x.UserName == userName, cancellationToken))
        {
            throw new ValidationException("UserName is already in use.");
        }

        var employee = new Employee
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = ValidationHelpers.NullIfWhitespace(request.Email),
            UserName = userName,
            PasswordHash = authService.HashPassword(request.Password),
            Role = request.Role,
            Status = EmployeeStatus.Active
        };

        dbContext.Employees.Add(employee);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapUser.Compile().Invoke(employee);
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto request, CancellationToken cancellationToken = default)
    {
        var employee = await dbContext.Employees.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
        {
            return null;
        }

        ValidateRole(request.Role);

        if (!string.Equals(employee.UserName, request.UserName, StringComparison.OrdinalIgnoreCase)
            && await dbContext.Employees.AnyAsync(x => x.UserName == request.UserName && x.Id != id, cancellationToken))
        {
            throw new ValidationException("UserName is already in use.");
        }

        employee.FirstName = request.FirstName.Trim();
        employee.LastName = request.LastName.Trim();
        employee.Email = ValidationHelpers.NullIfWhitespace(request.Email);
        employee.UserName = request.UserName.Trim();
        employee.Role = request.Role;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapUser.Compile().Invoke(employee);
    }

    public async Task<UserDto?> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await dbContext.Employees.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
        {
            return null;
        }

        employee.IsDeleted = true;
        employee.DeletedAtUtc = DateTime.UtcNow;
        employee.Status = EmployeeStatus.Inactive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MapUser.Compile().Invoke(employee);
    }

    public async Task<UserDto?> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default)
    {
        var employee = await dbContext.Employees.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (employee is null)
        {
            return null;
        }

        employee.PasswordHash = authService.HashPassword(newPassword);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapUser.Compile().Invoke(employee);
    }

    private static void ValidateRole(string role)
    {
        if (!SystemRoles.All.Contains(role))
        {
            throw new ValidationException("Role must be one of: Admin, Manager, Employee.");
        }
    }

    private static readonly System.Linq.Expressions.Expression<Func<Employee, UserDto>> MapUser = x =>
        new(x.Id, x.UserName, x.Email, x.FirstName, x.LastName, x.Role ?? string.Empty, x.Status, x.IsDeleted);
}

public sealed record UserDto(Guid Id, string? UserName, string? Email, string FirstName, string LastName, string Role, EmployeeStatus Status, bool IsArchived);
public sealed record CreateUserDto(string UserName, string? Email, string FirstName, string LastName, string Role, string Password);
public sealed record UpdateUserDto(string UserName, string? Email, string FirstName, string LastName, string Role);
public sealed record ResetPasswordDto(string NewPassword);
