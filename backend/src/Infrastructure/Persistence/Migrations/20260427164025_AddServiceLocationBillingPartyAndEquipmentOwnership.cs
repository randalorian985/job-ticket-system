using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceLocationBillingPartyAndEquipmentOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BillingContactEmail",
                table: "JobTickets",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillingContactName",
                table: "JobTickets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillingContactPhone",
                table: "JobTickets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BillingPartyCustomerId",
                table: "JobTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseOrderNumber",
                table: "JobTickets",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceLocationId",
                table: "JobTickets",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerCustomerId",
                table: "Equipment",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ResponsibleBillingCustomerId",
                table: "Equipment",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceLocationId",
                table: "Equipment",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ServiceLocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LocationName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OnSiteContactName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    OnSiteContactPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OnSiteContactEmail = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    AddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ParishCounty = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    GateCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AccessInstructions = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SafetyRequirements = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SiteNotes = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Latitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                    Longitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceLocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceLocations_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO ServiceLocations
                    (Id, CustomerId, CompanyName, LocationName, AddressLine1, City, State, PostalCode, Country, IsActive, CreatedAtUtc, UpdatedAtUtc, IsDeleted)
                SELECT
                    NEWID(),
                    c.Id,
                    c.Name,
                    CONCAT(c.Name, ' Primary Service Location'),
                    COALESCE(c.BillingAddressLine1, 'Address not specified'),
                    COALESCE(c.BillingCity, 'Unknown'),
                    COALESCE(c.BillingState, 'Unknown'),
                    COALESCE(c.BillingPostalCode, 'Unknown'),
                    'United States',
                    1,
                    SYSUTCDATETIME(),
                    SYSUTCDATETIME(),
                    0
                FROM Customers c
                WHERE NOT EXISTS
                (
                    SELECT 1
                    FROM ServiceLocations s
                    WHERE s.CustomerId = c.Id
                );
                """);

            migrationBuilder.Sql(
                """
                UPDATE e
                SET e.ServiceLocationId = sl.Id
                FROM Equipment e
                INNER JOIN ServiceLocations sl
                    ON sl.CustomerId = e.CustomerId
                WHERE e.ServiceLocationId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE jt
                SET jt.BillingPartyCustomerId = jt.CustomerId
                FROM JobTickets jt
                WHERE jt.BillingPartyCustomerId IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE jt
                SET jt.ServiceLocationId = COALESCE(e.ServiceLocationId, sl.Id)
                FROM JobTickets jt
                LEFT JOIN Equipment e ON e.Id = jt.EquipmentId
                LEFT JOIN ServiceLocations sl ON sl.CustomerId = jt.CustomerId
                WHERE jt.ServiceLocationId IS NULL;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "ServiceLocationId",
                table: "Equipment",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ServiceLocationId",
                table: "JobTickets",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "BillingPartyCustomerId",
                table: "JobTickets",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_BillingPartyCustomerId",
                table: "JobTickets",
                column: "BillingPartyCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTickets_ServiceLocationId",
                table: "JobTickets",
                column: "ServiceLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_OwnerCustomerId",
                table: "Equipment",
                column: "OwnerCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_ResponsibleBillingCustomerId",
                table: "Equipment",
                column: "ResponsibleBillingCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_ServiceLocationId",
                table: "Equipment",
                column: "ServiceLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceLocations_CustomerId",
                table: "ServiceLocations",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Customers_OwnerCustomerId",
                table: "Equipment",
                column: "OwnerCustomerId",
                principalTable: "Customers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_Customers_ResponsibleBillingCustomerId",
                table: "Equipment",
                column: "ResponsibleBillingCustomerId",
                principalTable: "Customers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Equipment_ServiceLocations_ServiceLocationId",
                table: "Equipment",
                column: "ServiceLocationId",
                principalTable: "ServiceLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JobTickets_Customers_BillingPartyCustomerId",
                table: "JobTickets",
                column: "BillingPartyCustomerId",
                principalTable: "Customers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_JobTickets_ServiceLocations_ServiceLocationId",
                table: "JobTickets",
                column: "ServiceLocationId",
                principalTable: "ServiceLocations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Customers_OwnerCustomerId",
                table: "Equipment");

            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_Customers_ResponsibleBillingCustomerId",
                table: "Equipment");

            migrationBuilder.DropForeignKey(
                name: "FK_Equipment_ServiceLocations_ServiceLocationId",
                table: "Equipment");

            migrationBuilder.DropForeignKey(
                name: "FK_JobTickets_Customers_BillingPartyCustomerId",
                table: "JobTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_JobTickets_ServiceLocations_ServiceLocationId",
                table: "JobTickets");

            migrationBuilder.DropTable(
                name: "ServiceLocations");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_BillingPartyCustomerId",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_JobTickets_ServiceLocationId",
                table: "JobTickets");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_OwnerCustomerId",
                table: "Equipment");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_ResponsibleBillingCustomerId",
                table: "Equipment");

            migrationBuilder.DropIndex(
                name: "IX_Equipment_ServiceLocationId",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "BillingContactEmail",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "BillingContactName",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "BillingContactPhone",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "BillingPartyCustomerId",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderNumber",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "ServiceLocationId",
                table: "JobTickets");

            migrationBuilder.DropColumn(
                name: "OwnerCustomerId",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "ResponsibleBillingCustomerId",
                table: "Equipment");

            migrationBuilder.DropColumn(
                name: "ServiceLocationId",
                table: "Equipment");
        }
    }
}
