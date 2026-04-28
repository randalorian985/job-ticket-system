using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPreManagerAdminHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BillRateSnapshot",
                table: "TimeEntries",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CostRateSnapshot",
                table: "TimeEntries",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_Name",
                table: "Vendors",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_ApprovalStatus",
                table: "TimeEntries",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_EmployeeId_EndedAtUtc",
                table: "TimeEntries",
                columns: new[] { "EmployeeId", "EndedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_EndedAtUtc",
                table: "TimeEntries",
                column: "EndedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_StartedAtUtc",
                table: "TimeEntries",
                column: "StartedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_CompanyName",
                table: "ServiceLocations",
                column: "CompanyName");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_IsActive",
                table: "ServiceLocations",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_LocationName",
                table: "ServiceLocations",
                column: "LocationName");

            migrationBuilder.CreateIndex(
                name: "IX_Parts_Name",
                table: "Parts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_CompletedAtUtc",
                table: "JobTickets",
                column: "CompletedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_CreatedAtUtc",
                table: "JobTickets",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_Priority",
                table: "JobTickets",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_ScheduledStartAtUtc",
                table: "JobTickets",
                column: "ScheduledStartAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_Status",
                table: "JobTickets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_ApprovalStatus",
                table: "JobTicketParts",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_JobTicketId_ApprovalStatus",
                table: "JobTicketParts",
                columns: new[] { "JobTicketId", "ApprovalStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketFiles_CreatedAtUtc",
                table: "JobTicketFiles",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketFiles_IsInvoiceAttachment",
                table: "JobTicketFiles",
                column: "IsInvoiceAttachment");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Name",
                table: "Customers",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Status",
                table: "Customers",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vendors_Name",
                table: "Vendors");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_ApprovalStatus",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_EmployeeId_EndedAtUtc",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_EndedAtUtc",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_TimeEntries_StartedAtUtc",
                table: "TimeEntries");

            migrationBuilder.DropIndex(
                name: "IX_ServiceLocations_CompanyName",
                table: "ServiceLocations");

            migrationBuilder.DropIndex(
                name: "IX_ServiceLocations_IsActive",
                table: "ServiceLocations");

            migrationBuilder.DropIndex(
                name: "IX_ServiceLocations_LocationName",
                table: "ServiceLocations");

            migrationBuilder.DropIndex(
                name: "IX_Parts_Name",
                table: "Parts");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_CompletedAtUtc",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_CreatedAtUtc",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_Priority",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_ScheduledStartAtUtc",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_Status",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_ApprovalStatus",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_JobTicketId_ApprovalStatus",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketFiles_CreatedAtUtc",
                table: "JobTicketFiles");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketFiles_IsInvoiceAttachment",
                table: "JobTicketFiles");

            migrationBuilder.DropIndex(
                name: "IX_Customers_Name",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_Status",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "BillRateSnapshot",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "CostRateSnapshot",
                table: "TimeEntries");
        }
    }
}
