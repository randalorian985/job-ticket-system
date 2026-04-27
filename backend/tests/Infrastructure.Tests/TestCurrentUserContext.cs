using JobTicketSystem.Application.Security;

namespace JobTicketSystem.Infrastructure.Tests;

internal sealed class TestCurrentUserContext(Guid employeeId, string role, bool isAuthenticated = true) : ICurrentUserContext
{
    public Guid UserId => employeeId;
    public Guid EmployeeId => employeeId;
    public string Role => role;
    public bool IsAuthenticated => isAuthenticated;
    public bool IsAdmin => string.Equals(role, SystemRoles.Admin, StringComparison.OrdinalIgnoreCase);
    public bool IsManager => IsAdmin || string.Equals(role, SystemRoles.Manager, StringComparison.OrdinalIgnoreCase);
    public bool IsEmployee => IsManager || string.Equals(role, SystemRoles.Employee, StringComparison.OrdinalIgnoreCase);
}
