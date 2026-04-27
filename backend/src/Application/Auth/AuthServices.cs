using System.Security.Cryptography;
using JobTicketSystem.Application.MasterData;
using JobTicketSystem.Application.Security;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace JobTicketSystem.Application.Auth;

public interface IAuthService
{
    Task<AuthLoginResultDto?> LoginAsync(AuthLoginRequestDto request, CancellationToken cancellationToken = default);
    Task<AuthMeDto?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
    string HashPassword(string password);
}

public sealed class AuthService(ApplicationDbContext dbContext, ICurrentUserContext currentUserContext) : IAuthService
{
    public async Task<AuthLoginResultDto?> LoginAsync(AuthLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        ValidationHelpers.ValidateRequired(request.UsernameOrEmail, nameof(request.UsernameOrEmail));
        ValidationHelpers.ValidateRequired(request.Password, nameof(request.Password));

        var lookup = request.UsernameOrEmail.Trim();
        var employee = await dbContext.Employees
            .Where(x => x.UserName == lookup || x.Email == lookup)
            .SingleOrDefaultAsync(cancellationToken);

        if (employee is null || string.IsNullOrWhiteSpace(employee.PasswordHash))
        {
            return null;
        }

        if (!VerifyPassword(request.Password, employee.PasswordHash))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(employee.Role) || !SystemRoles.All.Contains(employee.Role))
        {
            throw new ValidationException("Employee role is missing or invalid.");
        }

        return new AuthLoginResultDto(employee.Id, employee.UserName ?? employee.Email!, employee.Email, employee.FirstName, employee.LastName, employee.Role);
    }

    public async Task<AuthMeDto?> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        if (!currentUserContext.IsAuthenticated)
        {
            return null;
        }

        return await dbContext.Employees
            .Where(x => x.Id == currentUserContext.EmployeeId)
            .Select(x => new AuthMeDto(x.Id, x.UserName ?? x.Email ?? string.Empty, x.Email, x.FirstName, x.LastName, x.Role ?? string.Empty))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public string HashPassword(string password)
    {
        ValidationHelpers.ValidateRequired(password, nameof(password));
        return PasswordHasher.Hash(password);
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        return PasswordHasher.Verify(password, storedHash);
    }
}

public sealed record AuthLoginRequestDto(string UsernameOrEmail, string Password);
public sealed record AuthLoginResultDto(Guid EmployeeId, string Username, string? Email, string FirstName, string LastName, string Role);
public sealed record AuthLoginResponseDto(string AccessToken, DateTime ExpiresAtUtc, AuthMeDto User);
public sealed record AuthMeDto(Guid EmployeeId, string Username, string? Email, string FirstName, string LastName, string Role);

public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 100_000;

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        var parts = storedHash.Split('.', 3);
        if (parts.Length != 3 || !int.TryParse(parts[0], out var iterations))
        {
            return false;
        }

        var salt = Convert.FromBase64String(parts[1]);
        var hash = Convert.FromBase64String(parts[2]);
        var computedHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, hash.Length);
        return CryptographicOperations.FixedTimeEquals(hash, computedHash);
    }
}
