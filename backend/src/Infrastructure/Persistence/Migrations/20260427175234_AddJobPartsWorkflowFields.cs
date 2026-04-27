using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPartsWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UnitCost",
                table: "JobTicketParts",
                newName: "UnitCostSnapshot");

            migrationBuilder.RenameColumn(
                name: "UnitPrice",
                table: "JobTicketParts",
                newName: "SalePriceSnapshot");

            migrationBuilder.AddColumn<Guid>(
                name: "AddedByEmployeeId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "JobTicketParts",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                table: "JobTicketParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBillable",
                table: "JobTicketParts",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "JobTicketParts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAtUtc",
                table: "JobTicketParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RejectedByUserId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "JobTicketParts",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_AddedByEmployeeId",
                table: "JobTicketParts",
                column: "AddedByEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketParts_Employees_AddedByEmployeeId",
                table: "JobTicketParts",
                column: "AddedByEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketParts_Employees_AddedByEmployeeId",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_AddedByEmployeeId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "AddedByEmployeeId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "IsBillable",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "RejectedAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "RejectedByUserId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "JobTicketParts");

            migrationBuilder.RenameColumn(
                name: "UnitCostSnapshot",
                table: "JobTicketParts",
                newName: "UnitCost");

            migrationBuilder.RenameColumn(
                name: "SalePriceSnapshot",
                table: "JobTicketParts",
                newName: "UnitPrice");
        }
    }
}
