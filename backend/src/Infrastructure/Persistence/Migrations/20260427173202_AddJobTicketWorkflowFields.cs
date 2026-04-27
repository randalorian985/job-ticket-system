using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTicketWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ArchiveReason",
                table: "JobTickets",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedManagerEmployeeId",
                table: "JobTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerFacingNotes",
                table: "JobTickets",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueAtUtc",
                table: "JobTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalNotes",
                table: "JobTickets",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JobType",
                table: "JobTickets",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_AssignedManagerEmployeeId",
                table: "JobTickets",
                column: "AssignedManagerEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTickets_Employees_AssignedManagerEmployeeId",
                table: "JobTickets",
                column: "AssignedManagerEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTickets_Employees_AssignedManagerEmployeeId",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_AssignedManagerEmployeeId",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "ArchiveReason",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "AssignedManagerEmployeeId",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "CustomerFacingNotes",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "DueAtUtc",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "InternalNotes",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "JobType",
                table: "JobTickets");
        }
    }
}
