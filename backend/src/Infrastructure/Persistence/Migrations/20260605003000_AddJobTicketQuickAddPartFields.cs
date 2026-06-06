using System;
using JobTicketSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260605003000_AddJobTicketQuickAddPartFields")]
    public partial class AddJobTicketQuickAddPartFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketParts_Parts_PartId",
                table: "JobTicketParts");

            migrationBuilder.AddColumn<bool>(
                name: "IsUnlistedPart",
                table: "JobTicketParts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OfficeOrderNotes",
                table: "JobTicketParts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "OfficeOrderRequested",
                table: "JobTicketParts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "OfficeOrderRequestedAtUtc",
                table: "JobTicketParts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PartNameSnapshot",
                table: "JobTicketParts",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PartNumberSnapshot",
                table: "JobTicketParts",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE jtp
                SET
                    PartNumberSnapshot = p.PartNumber,
                    PartNameSnapshot = p.Name
                FROM JobTicketParts jtp
                INNER JOIN Parts p ON p.Id = jtp.PartId
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "PartId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_OfficeOrderRequested",
                table: "JobTicketParts",
                column: "OfficeOrderRequested");

            migrationBuilder.CreateIndex(
                name: "IX_JobTicketParts_PartNumberSnapshot",
                table: "JobTicketParts",
                column: "PartNumberSnapshot");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketParts_Parts_PartId",
                table: "JobTicketParts",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobTicketParts_Parts_PartId",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_OfficeOrderRequested",
                table: "JobTicketParts");

            migrationBuilder.DropIndex(
                name: "IX_JobTicketParts_PartNumberSnapshot",
                table: "JobTicketParts");

            migrationBuilder.Sql("DELETE FROM JobTicketParts WHERE PartId IS NULL");

            migrationBuilder.AlterColumn<Guid>(
                name: "PartId",
                table: "JobTicketParts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "IsUnlistedPart",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "OfficeOrderNotes",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "OfficeOrderRequested",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "OfficeOrderRequestedAtUtc",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "PartNameSnapshot",
                table: "JobTicketParts");

            migrationBuilder.DropColumn(
                name: "PartNumberSnapshot",
                table: "JobTicketParts");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTicketParts_Parts_PartId",
                table: "JobTicketParts",
                column: "PartId",
                principalTable: "Parts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
