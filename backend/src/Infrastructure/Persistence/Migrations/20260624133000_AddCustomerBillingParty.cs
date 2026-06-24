using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerBillingParty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BillingPartyCustomerId",
                table: "Customers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_BillingPartyCustomerId",
                table: "Customers",
                column: "BillingPartyCustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Customers_BillingPartyCustomerId",
                table: "Customers",
                column: "BillingPartyCustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Customers_BillingPartyCustomerId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_BillingPartyCustomerId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "BillingPartyCustomerId",
                table: "Customers");
        }
    }
}
