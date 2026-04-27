using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPartsCompatibilityDataCaptureFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompatibilityNotes",
                table: "JobTicketParts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ComponentCategory",
                table: "JobTicketParts",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EquipmentId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FailureDescription",
                table: "JobTicketParts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InstalledAtUtc",
                table: "JobTicketParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RemovedAtUtc",
                table: "JobTicketParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepairDescription",
                table: "JobTicketParts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReplacedByJobTicketPartId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicianNotes",
                table: "JobTicketParts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WasSuccessful",
                table: "JobTicketParts",
                type: "bit",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SerialNumber",
                table: "Equipment",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EquipmentType",
                table: "Equipment",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Manufacturer",
                table: "Equipment",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModelNumber",
                table: "Equipment",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitNumber",
                table: "Equipment",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "Equipment",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_ComponentCategory",
                table: "JobTicketParts",
                column: "ComponentCategory");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_EquipmentId",
                table: "JobTicketParts",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_InstalledAtUtc",
                table: "JobTicketParts",
                column: "InstalledAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_ReplacedByJobTicketPartId",
                table: "JobTicketParts",
                column: "ReplacedByJobTicketPartId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_WasSuccessful",
                table: "JobTicketParts",
                column: "WasSuccessful");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_Manufacturer",
                table: "Equipment",
                column: "Manufacturer");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_ModelNumber",
                table: "Equipment",
                column: "ModelNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_SerialNumber",
                table: "Equipment",
                column: "SerialNumber");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketParts_Equipment_EquipmentId",
                table: "JobTicketParts",
                column: "EquipmentId",
                principalTable: "Equipment",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketParts_JobTicketParts_ReplacedByJobTicketPartId",
                table: "JobTicketParts",
                column: "ReplacedByJobTicketPartId",
                principalTable: "JobTicketParts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketParts_Equipment_EquipmentId",
                table: "JobTicketParts");

            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketParts_JobTicketParts_ReplacedByJobTicketPartId",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_ComponentCategory",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_EquipmentId",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_InstalledAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_ReplacedByJobTicketPartId",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_WasSuccessful",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_Manufacturer",
                table: "Equipment");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_ModelNumber",
                table: "Equipment");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_SerialNumber",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "CompatibilityNotes",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "ComponentCategory",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "EquipmentId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "FailureDescription",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "InstalledAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "RemovedAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "RepairDescription",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "ReplacedByJobTicketPartId",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "TechnicianNotes",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "WasSuccessful",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "EquipmentType",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "Manufacturer",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "ModelNumber",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "UnitNumber",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "Equipment");

            migrationBuilder.AlterColumn<string>(
                name: "SerialNumber",
                table: "Equipment",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200,
                oldNullable: true);
        }
    }
}
