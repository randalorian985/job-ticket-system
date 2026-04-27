using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeTrackingWorkflowFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "NewBillableHours",
                table: "TimeEntryAdjustments",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "NewEndedAtUtc",
                table: "TimeEntryAdjustments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NewHourlyRate",
                table: "TimeEntryAdjustments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NewLaborHours",
                table: "TimeEntryAdjustments",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "NewNotes",
                table: "TimeEntryAdjustments",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NewStartedAtUtc",
                table: "TimeEntryAdjustments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalBillableHours",
                table: "TimeEntryAdjustments",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "OriginalEndedAtUtc",
                table: "TimeEntryAdjustments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalHourlyRate",
                table: "TimeEntryAdjustments",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalLaborHours",
                table: "TimeEntryAdjustments",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "OriginalNotes",
                table: "TimeEntryAdjustments",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OriginalStartedAtUtc",
                table: "TimeEntryAdjustments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "ClockInAccuracy",
                table: "TimeEntries",
                type: "decimal(9,3)",
                precision: 9,
                scale: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClockInDeviceMetadata",
                table: "TimeEntries",
                type: "nvarchar(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClockInLatitude",
                table: "TimeEntries",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ClockInLongitude",
                table: "TimeEntries",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ClockInNote",
                table: "TimeEntries",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClockOutAccuracy",
                table: "TimeEntries",
                type: "decimal(9,3)",
                precision: 9,
                scale: 3,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClockOutLatitude",
                table: "TimeEntries",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClockOutLongitude",
                table: "TimeEntries",
                type: "decimal(9,6)",
                precision: 9,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClockOutNote",
                table: "TimeEntries",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "TimeEntries",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalMinutes",
                table: "TimeEntries",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkSummary",
                table: "TimeEntries",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NewBillableHours",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "NewEndedAtUtc",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "NewHourlyRate",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "NewLaborHours",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "NewNotes",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "NewStartedAtUtc",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalBillableHours",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalEndedAtUtc",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalHourlyRate",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalLaborHours",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalNotes",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "OriginalStartedAtUtc",
                table: "TimeEntryAdjustments");

            migrationBuilder.DropColumn(
                name: "ClockInAccuracy",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockInDeviceMetadata",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockInLatitude",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockInLongitude",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockInNote",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockOutAccuracy",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockOutLatitude",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockOutLongitude",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "ClockOutNote",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "TotalMinutes",
                table: "TimeEntries");

            migrationBuilder.DropColumn(
                name: "WorkSummary",
                table: "TimeEntries");
        }
    }
}
