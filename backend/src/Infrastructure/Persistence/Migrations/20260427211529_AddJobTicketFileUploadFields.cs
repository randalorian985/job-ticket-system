using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTicketFileUploadFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "JobTicketFiles");

            migrationBuilder.RenameColumn(
                name: "StoragePath",
                table: "JobTicketFiles",
                newName: "StorageKey");

            migrationBuilder.RenameColumn(
                name: "FileName",
                table: "JobTicketFiles",
                newName: "OriginalFileName");

            migrationBuilder.AddColumn<string>(
                name: "Caption",
                table: "JobTicketFiles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EquipmentId",
                table: "JobTicketFiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileExtension",
                table: "JobTicketFiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsInvoiceAttachment",
                table: "JobTicketFiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "UploadedByEmployeeId",
                table: "JobTicketFiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WorkEntryId",
                table: "JobTicketFiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketFiles_EquipmentId",
                table: "JobTicketFiles",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketFiles_UploadedByEmployeeId",
                table: "JobTicketFiles",
                column: "UploadedByEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketFiles_WorkEntryId",
                table: "JobTicketFiles",
                column: "WorkEntryId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketFiles_Employees_UploadedByEmployeeId",
                table: "JobTicketFiles",
                column: "UploadedByEmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketFiles_Equipment_EquipmentId",
                table: "JobTicketFiles",
                column: "EquipmentId",
                principalTable: "Equipment",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketFiles_JobWorkEntries_WorkEntryId",
                table: "JobTicketFiles",
                column: "WorkEntryId",
                principalTable: "JobWorkEntries",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketFiles_Employees_UploadedByEmployeeId",
                table: "JobTicketFiles");

            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketFiles_Equipment_EquipmentId",
                table: "JobTicketFiles");

            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketFiles_JobWorkEntries_WorkEntryId",
                table: "JobTicketFiles");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketFiles_EquipmentId",
                table: "JobTicketFiles");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketFiles_UploadedByEmployeeId",
                table: "JobTicketFiles");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketFiles_WorkEntryId",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "Caption",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "EquipmentId",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "FileExtension",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "IsInvoiceAttachment",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "UploadedByEmployeeId",
                table: "JobTicketFiles");

            migrationBuilder.DropColumn(
                name: "WorkEntryId",
                table: "JobTicketFiles");

            migrationBuilder.RenameColumn(
                name: "StorageKey",
                table: "JobTicketFiles",
                newName: "StoragePath");

            migrationBuilder.RenameColumn(
                name: "OriginalFileName",
                table: "JobTicketFiles",
                newName: "FileName");

            migrationBuilder.AddColumn<Guid>(
                name: "UploadedByUserId",
                table: "JobTicketFiles",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }
    }
}
