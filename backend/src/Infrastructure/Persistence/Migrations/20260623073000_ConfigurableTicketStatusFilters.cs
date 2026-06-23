using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConfigurableTicketStatusFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TicketStatusFilterOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketStatusFilterOptions", x => x.Id);
                });

            migrationBuilder.Sql("""
                DECLARE @SeededAt datetime2 = '2026-06-23T00:00:00';

                IF NOT EXISTS (SELECT 1 FROM [TicketStatusFilterOptions])
                BEGIN
                    INSERT INTO [TicketStatusFilterOptions] ([Id], [DisplayLabel], [Status], [DisplayOrder], [IsActive], [UpdatedByUserId], [CreatedAtUtc], [UpdatedAtUtc])
                    VALUES
                        ('0f747a37-c8b8-4f59-b27b-7f5933fc86b8', N'Submitted', 2, 10, CAST(1 AS bit), NULL, @SeededAt, @SeededAt),
                        ('cb4421b3-0030-4a34-b8e0-a2c7d56844bf', N'Assigned', 3, 20, CAST(1 AS bit), NULL, @SeededAt, @SeededAt),
                        ('db738d94-5064-4d2f-98eb-e4d5661e8f5b', N'In Progress', 4, 30, CAST(1 AS bit), NULL, @SeededAt, @SeededAt),
                        ('584a66db-2332-4590-8b22-0a96134aac56', N'Waiting on Parts', 5, 40, CAST(1 AS bit), NULL, @SeededAt, @SeededAt),
                        ('3ed284cc-a83b-4fdc-b094-3a7466e9d5d1', N'Waiting on Customer', 6, 50, CAST(1 AS bit), NULL, @SeededAt, @SeededAt);
                END
                """);

            migrationBuilder.CreateIndex(
                name: "IX_TicketStatusFilterOptions_DisplayOrder",
                table: "TicketStatusFilterOptions",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_TicketStatusFilterOptions_IsActive_DisplayOrder",
                table: "TicketStatusFilterOptions",
                columns: new[] { "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketStatusFilterOptions_Status",
                table: "TicketStatusFilterOptions",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketStatusFilterOptions");
        }
    }
}
