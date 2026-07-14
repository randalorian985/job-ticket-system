/*
 Job Ticket System - Local SQL Server Database Export
 Generated from the repository's Entity Framework Core migration history.

 Target: Microsoft SQL Server 2022 or later
 Database: JobTicketDb

 This script creates the database when it does not exist, then applies every
 schema migration that has not already been recorded. It may be safely rerun.
 It contains required reference seed records but no production or demo data.
*/

IF DB_ID(N'JobTicketDb') IS NULL
BEGIN
    CREATE DATABASE [JobTicketDb];
END;
GO

USE [JobTicketDb];
GO

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] uniqueidentifier NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UserId] uniqueidentifier NULL,
        [EntityName] nvarchar(200) NOT NULL,
        [EntityId] uniqueidentifier NULL,
        [ActionType] int NOT NULL,
        [OldValuesJson] nvarchar(max) NULL,
        [NewValuesJson] nvarchar(max) NULL,
        [IpAddress] nvarchar(64) NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [Customers] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [AccountNumber] nvarchar(50) NULL,
        [ContactName] nvarchar(max) NULL,
        [Email] nvarchar(320) NULL,
        [Phone] nvarchar(max) NULL,
        [BillingAddressLine1] nvarchar(max) NULL,
        [BillingAddressLine2] nvarchar(max) NULL,
        [BillingCity] nvarchar(max) NULL,
        [BillingState] nvarchar(max) NULL,
        [BillingPostalCode] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [Employees] (
        [Id] uniqueidentifier NOT NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Email] nvarchar(320) NULL,
        [Phone] nvarchar(max) NULL,
        [Role] nvarchar(max) NULL,
        [LaborRate] decimal(18,2) NULL,
        [Status] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Employees] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [PartCategories] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(150) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_PartCategories] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [Vendors] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [AccountNumber] nvarchar(max) NULL,
        [ContactName] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [Phone] nvarchar(max) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Vendors] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [Equipment] (
        [Id] uniqueidentifier NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [EquipmentNumber] nvarchar(max) NULL,
        [Make] nvarchar(max) NULL,
        [Model] nvarchar(max) NULL,
        [SerialNumber] nvarchar(max) NULL,
        [LocationDescription] nvarchar(max) NULL,
        [Latitude] decimal(9,6) NULL,
        [Longitude] decimal(9,6) NULL,
        [Status] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Equipment] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Equipment_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [Parts] (
        [Id] uniqueidentifier NOT NULL,
        [PartCategoryId] uniqueidentifier NOT NULL,
        [VendorId] uniqueidentifier NULL,
        [PartNumber] nvarchar(100) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [UnitCost] decimal(18,2) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [QuantityOnHand] decimal(18,4) NOT NULL,
        [ReorderThreshold] decimal(18,4) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Parts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Parts_PartCategories_PartCategoryId] FOREIGN KEY ([PartCategoryId]) REFERENCES [PartCategories] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Parts_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [JobTickets] (
        [Id] uniqueidentifier NOT NULL,
        [TicketNumber] nvarchar(50) NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [EquipmentId] uniqueidentifier NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [Priority] int NOT NULL,
        [RequestedAtUtc] datetime2 NULL,
        [ScheduledStartAtUtc] datetime2 NULL,
        [ScheduledEndAtUtc] datetime2 NULL,
        [CompletedAtUtc] datetime2 NULL,
        [SiteLatitude] decimal(9,6) NULL,
        [SiteLongitude] decimal(9,6) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_JobTickets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobTickets_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_JobTickets_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [InvoiceSummaries] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [InvoiceNumber] nvarchar(50) NULL,
        [Status] int NOT NULL,
        [LaborSubtotal] decimal(18,2) NOT NULL,
        [PartsSubtotal] decimal(18,2) NOT NULL,
        [TaxAmount] decimal(18,2) NOT NULL,
        [DiscountAmount] decimal(18,2) NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [ReadyAtUtc] datetime2 NULL,
        [InvoicedAtUtc] datetime2 NULL,
        [PaidAtUtc] datetime2 NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_InvoiceSummaries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InvoiceSummaries_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InvoiceSummaries_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [JobTicketEmployees] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [AssignedAtUtc] datetime2 NOT NULL,
        [AssignedByUserId] uniqueidentifier NULL,
        [IsLead] bit NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_JobTicketEmployees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobTicketEmployees_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_JobTicketEmployees_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [JobTicketFiles] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [ContentType] nvarchar(150) NOT NULL,
        [StoragePath] nvarchar(1000) NOT NULL,
        [FileSizeBytes] bigint NOT NULL,
        [Visibility] int NOT NULL,
        [UploadedByUserId] uniqueidentifier NOT NULL,
        [UploadedAtUtc] datetime2 NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_JobTicketFiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobTicketFiles_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [JobTicketParts] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [PartId] uniqueidentifier NOT NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [UnitCost] decimal(18,2) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [Status] int NOT NULL,
        [AddedAtUtc] datetime2 NOT NULL,
        [AddedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_JobTicketParts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobTicketParts_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_JobTicketParts_Parts_PartId] FOREIGN KEY ([PartId]) REFERENCES [Parts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [JobWorkEntries] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NULL,
        [EntryType] int NOT NULL,
        [Notes] nvarchar(4000) NOT NULL,
        [PerformedAtUtc] datetime2 NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_JobWorkEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_JobWorkEntries_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_JobWorkEntries_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [TimeEntries] (
        [Id] uniqueidentifier NOT NULL,
        [JobTicketId] uniqueidentifier NOT NULL,
        [EmployeeId] uniqueidentifier NOT NULL,
        [StartedAtUtc] datetime2 NOT NULL,
        [EndedAtUtc] datetime2 NULL,
        [LaborHours] decimal(18,4) NOT NULL,
        [BillableHours] decimal(18,4) NOT NULL,
        [HourlyRate] decimal(18,2) NOT NULL,
        [ApprovalStatus] int NOT NULL,
        [ApprovedByUserId] uniqueidentifier NULL,
        [ApprovedAtUtc] datetime2 NULL,
        [Notes] nvarchar(max) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_TimeEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TimeEntries_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TimeEntries_JobTickets_JobTicketId] FOREIGN KEY ([JobTicketId]) REFERENCES [JobTickets] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE TABLE [TimeEntryAdjustments] (
        [Id] uniqueidentifier NOT NULL,
        [TimeEntryId] uniqueidentifier NOT NULL,
        [AdjustmentType] int NOT NULL,
        [Hours] decimal(18,4) NOT NULL,
        [Reason] nvarchar(1000) NOT NULL,
        [AdjustedByUserId] uniqueidentifier NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TimeEntryAdjustments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TimeEntryAdjustments_TimeEntries_TimeEntryId] FOREIGN KEY ([TimeEntryId]) REFERENCES [TimeEntries] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_EntityName_EntityId] ON [AuditLogs] ([EntityName], [EntityId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Customers_AccountNumber] ON [Customers] ([AccountNumber]) WHERE [AccountNumber] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Employees_Email] ON [Employees] ([Email]) WHERE [Email] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_Equipment_CustomerId] ON [Equipment] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_InvoiceSummaries_CustomerId] ON [InvoiceSummaries] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_InvoiceSummaries_InvoiceNumber] ON [InvoiceSummaries] ([InvoiceNumber]) WHERE [InvoiceNumber] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE UNIQUE INDEX [IX_InvoiceSummaries_JobTicketId] ON [InvoiceSummaries] ([JobTicketId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTicketEmployees_EmployeeId] ON [JobTicketEmployees] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_JobTicketEmployees_JobTicketId_EmployeeId] ON [JobTicketEmployees] ([JobTicketId], [EmployeeId]) WHERE [IsDeleted] = 0');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_JobTicketId] ON [JobTicketFiles] ([JobTicketId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_JobTicketId] ON [JobTicketParts] ([JobTicketId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_PartId] ON [JobTicketParts] ([PartId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTickets_CustomerId] ON [JobTickets] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobTickets_EquipmentId] ON [JobTickets] ([EquipmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE UNIQUE INDEX [IX_JobTickets_TicketNumber] ON [JobTickets] ([TicketNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobWorkEntries_EmployeeId] ON [JobWorkEntries] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_JobWorkEntries_JobTicketId] ON [JobWorkEntries] ([JobTicketId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PartCategories_Name] ON [PartCategories] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_Parts_PartCategoryId] ON [Parts] ([PartCategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Parts_PartNumber] ON [Parts] ([PartNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_Parts_VendorId] ON [Parts] ([VendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_EmployeeId] ON [TimeEntries] ([EmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_JobTicketId] ON [TimeEntries] ([JobTicketId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    CREATE INDEX [IX_TimeEntryAdjustments_TimeEntryId] ON [TimeEntryAdjustments] ([TimeEntryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427162107_InitialCoreDatabaseModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427162107_InitialCoreDatabaseModel', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [BillingContactEmail] nvarchar(320) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [BillingContactName] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [BillingContactPhone] nvarchar(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [BillingPartyCustomerId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [PurchaseOrderNumber] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [ServiceLocationId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD [OwnerCustomerId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD [ResponsibleBillingCustomerId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD [ServiceLocationId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE TABLE [ServiceLocations] (
        [Id] uniqueidentifier NOT NULL,
        [CustomerId] uniqueidentifier NULL,
        [CompanyName] nvarchar(200) NOT NULL,
        [LocationName] nvarchar(200) NOT NULL,
        [OnSiteContactName] nvarchar(200) NULL,
        [OnSiteContactPhone] nvarchar(50) NULL,
        [OnSiteContactEmail] nvarchar(320) NULL,
        [AddressLine1] nvarchar(200) NOT NULL,
        [AddressLine2] nvarchar(200) NULL,
        [City] nvarchar(100) NOT NULL,
        [State] nvarchar(100) NOT NULL,
        [PostalCode] nvarchar(20) NOT NULL,
        [ParishCounty] nvarchar(100) NULL,
        [Country] nvarchar(100) NOT NULL,
        [GateCode] nvarchar(100) NULL,
        [AccessInstructions] nvarchar(2000) NULL,
        [SafetyRequirements] nvarchar(2000) NULL,
        [SiteNotes] nvarchar(4000) NULL,
        [Latitude] decimal(9,6) NULL,
        [Longitude] decimal(9,6) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_ServiceLocations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ServiceLocations_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    UPDATE e
    SET e.ServiceLocationId = sl.Id
    FROM Equipment e
    INNER JOIN ServiceLocations sl
        ON sl.CustomerId = e.CustomerId
    WHERE e.ServiceLocationId IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    UPDATE jt
    SET jt.BillingPartyCustomerId = jt.CustomerId
    FROM JobTickets jt
    WHERE jt.BillingPartyCustomerId IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    UPDATE jt
    SET jt.ServiceLocationId = COALESCE(e.ServiceLocationId, sl.Id)
    FROM JobTickets jt
    LEFT JOIN Equipment e ON e.Id = jt.EquipmentId
    LEFT JOIN ServiceLocations sl ON sl.CustomerId = jt.CustomerId
    WHERE jt.ServiceLocationId IS NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Equipment]') AND [c].[name] = N'ServiceLocationId');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Equipment] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Equipment] ALTER COLUMN [ServiceLocationId] uniqueidentifier NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobTickets]') AND [c].[name] = N'ServiceLocationId');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [JobTickets] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [JobTickets] ALTER COLUMN [ServiceLocationId] uniqueidentifier NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobTickets]') AND [c].[name] = N'BillingPartyCustomerId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [JobTickets] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [JobTickets] ALTER COLUMN [BillingPartyCustomerId] uniqueidentifier NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_JobTickets_BillingPartyCustomerId] ON [JobTickets] ([BillingPartyCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_JobTickets_ServiceLocationId] ON [JobTickets] ([ServiceLocationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_Equipment_OwnerCustomerId] ON [Equipment] ([OwnerCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_Equipment_ResponsibleBillingCustomerId] ON [Equipment] ([ResponsibleBillingCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_Equipment_ServiceLocationId] ON [Equipment] ([ServiceLocationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    CREATE INDEX [IX_ServiceLocations_CustomerId] ON [ServiceLocations] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD CONSTRAINT [FK_Equipment_Customers_OwnerCustomerId] FOREIGN KEY ([OwnerCustomerId]) REFERENCES [Customers] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD CONSTRAINT [FK_Equipment_Customers_ResponsibleBillingCustomerId] FOREIGN KEY ([ResponsibleBillingCustomerId]) REFERENCES [Customers] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [Equipment] ADD CONSTRAINT [FK_Equipment_ServiceLocations_ServiceLocationId] FOREIGN KEY ([ServiceLocationId]) REFERENCES [ServiceLocations] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD CONSTRAINT [FK_JobTickets_Customers_BillingPartyCustomerId] FOREIGN KEY ([BillingPartyCustomerId]) REFERENCES [Customers] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    ALTER TABLE [JobTickets] ADD CONSTRAINT [FK_JobTickets_ServiceLocations_ServiceLocationId] FOREIGN KEY ([ServiceLocationId]) REFERENCES [ServiceLocations] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427164025_AddServiceLocationBillingPartyAndEquipmentOwnership', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [ArchiveReason] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [AssignedManagerEmployeeId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [CustomerFacingNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [DueAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [InternalNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [JobType] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    CREATE INDEX [IX_JobTickets_AssignedManagerEmployeeId] ON [JobTickets] ([AssignedManagerEmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTickets] ADD CONSTRAINT [FK_JobTickets_Employees_AssignedManagerEmployeeId] FOREIGN KEY ([AssignedManagerEmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427173202_AddJobTicketWorkflowFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427173202_AddJobTicketWorkflowFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewBillableHours] decimal(18,4) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewEndedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewHourlyRate] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewLaborHours] decimal(18,4) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [NewStartedAtUtc] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalBillableHours] decimal(18,4) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalEndedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalHourlyRate] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalLaborHours] decimal(18,4) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntryAdjustments] ADD [OriginalStartedAtUtc] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockInAccuracy] decimal(9,3) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockInDeviceMetadata] nvarchar(1024) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockInLatitude] decimal(9,6) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockInLongitude] decimal(9,6) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockInNote] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockOutAccuracy] decimal(9,3) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockOutLatitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockOutLongitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [ClockOutNote] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [RejectionReason] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [TotalMinutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [WorkSummary] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427174309_AddTimeTrackingWorkflowFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427174309_AddTimeTrackingWorkflowFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    EXEC sp_rename N'[JobTicketParts].[UnitCost]', N'UnitCostSnapshot', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    EXEC sp_rename N'[JobTicketParts].[UnitPrice]', N'SalePriceSnapshot', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [AddedByEmployeeId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [ApprovalStatus] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [ApprovedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [ApprovedByUserId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [IsBillable] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [Notes] nvarchar(2000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [RejectedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [RejectedByUserId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [RejectionReason] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_AddedByEmployeeId] ON [JobTicketParts] ([AddedByEmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD CONSTRAINT [FK_JobTicketParts_Employees_AddedByEmployeeId] FOREIGN KEY ([AddedByEmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427175234_AddJobPartsWorkflowFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427175234_AddJobPartsWorkflowFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [CompatibilityNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [ComponentCategory] nvarchar(150) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [EquipmentId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [FailureDescription] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [InstalledAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [RemovedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [RepairDescription] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [ReplacedByJobTicketPartId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [TechnicianNotes] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [WasSuccessful] bit NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Equipment]') AND [c].[name] = N'SerialNumber');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Equipment] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [Equipment] ALTER COLUMN [SerialNumber] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [Equipment] ADD [EquipmentType] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [Equipment] ADD [Manufacturer] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [Equipment] ADD [ModelNumber] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [Equipment] ADD [UnitNumber] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [Equipment] ADD [Year] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_ComponentCategory] ON [JobTicketParts] ([ComponentCategory]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_EquipmentId] ON [JobTicketParts] ([EquipmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_InstalledAtUtc] ON [JobTicketParts] ([InstalledAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_ReplacedByJobTicketPartId] ON [JobTicketParts] ([ReplacedByJobTicketPartId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_WasSuccessful] ON [JobTicketParts] ([WasSuccessful]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_Equipment_Manufacturer] ON [Equipment] ([Manufacturer]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_Equipment_ModelNumber] ON [Equipment] ([ModelNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    CREATE INDEX [IX_Equipment_SerialNumber] ON [Equipment] ([SerialNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD CONSTRAINT [FK_JobTicketParts_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD CONSTRAINT [FK_JobTicketParts_JobTicketParts_ReplacedByJobTicketPartId] FOREIGN KEY ([ReplacedByJobTicketPartId]) REFERENCES [JobTicketParts] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427180515_AddPartsCompatibilityDataCaptureFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427180515_AddPartsCompatibilityDataCaptureFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427182116_AddReportingWorkflowFields'
)
BEGIN
    ALTER TABLE [Employees] ADD [BillRate] decimal(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427182116_AddReportingWorkflowFields'
)
BEGIN
    ALTER TABLE [Employees] ADD [CostRate] decimal(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427182116_AddReportingWorkflowFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427182116_AddReportingWorkflowFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobTicketFiles]') AND [c].[name] = N'UploadedByUserId');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [JobTicketFiles] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [JobTicketFiles] DROP COLUMN [UploadedByUserId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    EXEC sp_rename N'[JobTicketFiles].[StoragePath]', N'StorageKey', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    EXEC sp_rename N'[JobTicketFiles].[FileName]', N'OriginalFileName', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [Caption] nvarchar(500) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [EquipmentId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [FileExtension] nvarchar(20) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [IsInvoiceAttachment] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [UploadedByEmployeeId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD [WorkEntryId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_EquipmentId] ON [JobTicketFiles] ([EquipmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_UploadedByEmployeeId] ON [JobTicketFiles] ([UploadedByEmployeeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_WorkEntryId] ON [JobTicketFiles] ([WorkEntryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD CONSTRAINT [FK_JobTicketFiles_Employees_UploadedByEmployeeId] FOREIGN KEY ([UploadedByEmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD CONSTRAINT [FK_JobTicketFiles_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE SET NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    ALTER TABLE [JobTicketFiles] ADD CONSTRAINT [FK_JobTicketFiles_JobWorkEntries_WorkEntryId] FOREIGN KEY ([WorkEntryId]) REFERENCES [JobWorkEntries] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427211529_AddJobTicketFileUploadFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427211529_AddJobTicketFileUploadFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427214519_AddAuthenticationAndRoleEnforcement'
)
BEGIN
    ALTER TABLE [Employees] ADD [PasswordHash] nvarchar(512) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427214519_AddAuthenticationAndRoleEnforcement'
)
BEGIN
    ALTER TABLE [Employees] ADD [UserName] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427214519_AddAuthenticationAndRoleEnforcement'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Employees_UserName] ON [Employees] ([UserName]) WHERE [UserName] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427214519_AddAuthenticationAndRoleEnforcement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427214519_AddAuthenticationAndRoleEnforcement', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [BillRateSnapshot] decimal(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [CostRateSnapshot] decimal(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_Vendors_Name] ON [Vendors] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_ApprovalStatus] ON [TimeEntries] ([ApprovalStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_EmployeeId_EndedAtUtc] ON [TimeEntries] ([EmployeeId], [EndedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_EndedAtUtc] ON [TimeEntries] ([EndedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_StartedAtUtc] ON [TimeEntries] ([StartedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_ServiceLocations_CompanyName] ON [ServiceLocations] ([CompanyName]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_ServiceLocations_IsActive] ON [ServiceLocations] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_ServiceLocations_LocationName] ON [ServiceLocations] ([LocationName]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_Parts_Name] ON [Parts] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTickets_CompletedAtUtc] ON [JobTickets] ([CompletedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTickets_CreatedAtUtc] ON [JobTickets] ([CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTickets_Priority] ON [JobTickets] ([Priority]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTickets_ScheduledStartAtUtc] ON [JobTickets] ([ScheduledStartAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTickets_Status] ON [JobTickets] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_ApprovalStatus] ON [JobTicketParts] ([ApprovalStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_JobTicketId_ApprovalStatus] ON [JobTicketParts] ([JobTicketId], [ApprovalStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_CreatedAtUtc] ON [JobTicketFiles] ([CreatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_JobTicketFiles_IsInvoiceAttachment] ON [JobTicketFiles] ([IsInvoiceAttachment]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_Customers_Name] ON [Customers] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    CREATE INDEX [IX_Customers_Status] ON [Customers] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428170338_AddPreManagerAdminHardening'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260428170338_AddPreManagerAdminHardening', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE TABLE [PurchaseOrders] (
        [Id] uniqueidentifier NOT NULL,
        [VendorId] uniqueidentifier NOT NULL,
        [PurchaseOrderNumber] nvarchar(50) NOT NULL,
        [Status] int NOT NULL,
        [OrderedAtUtc] datetime2 NOT NULL,
        [ExpectedAtUtc] datetime2 NULL,
        [ReceivedAtUtc] datetime2 NULL,
        [VendorInvoiceNumber] nvarchar(100) NULL,
        [VendorInvoiceDateUtc] datetime2 NULL,
        [InvoiceStatus] int NOT NULL,
        [FreightCost] decimal(18,2) NOT NULL,
        [TaxAmount] decimal(18,2) NOT NULL,
        [OtherLandedCost] decimal(18,2) NOT NULL,
        [LandedCostNotes] nvarchar(2000) NULL,
        [Notes] nvarchar(4000) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_PurchaseOrders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrders_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE TABLE [PurchaseOrderLines] (
        [Id] uniqueidentifier NOT NULL,
        [PurchaseOrderId] uniqueidentifier NOT NULL,
        [PartId] uniqueidentifier NOT NULL,
        [QuantityOrdered] decimal(18,4) NOT NULL,
        [QuantityReceived] decimal(18,4) NOT NULL,
        [UnitCost] decimal(18,2) NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_PurchaseOrderLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrderLines_Parts_PartId] FOREIGN KEY ([PartId]) REFERENCES [Parts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PurchaseOrderLines_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderLines_PartId] ON [PurchaseOrderLines] ([PartId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderLines_PurchaseOrderId] ON [PurchaseOrderLines] ([PurchaseOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_ExpectedAtUtc] ON [PurchaseOrders] ([ExpectedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_InvoiceStatus] ON [PurchaseOrders] ([InvoiceStatus]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_OrderedAtUtc] ON [PurchaseOrders] ([OrderedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PurchaseOrders_PurchaseOrderNumber] ON [PurchaseOrders] ([PurchaseOrderNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_Status] ON [PurchaseOrders] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_VendorId] ON [PurchaseOrders] ([VendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260514184800_AddPurchasingRecordsWorkflow'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260514184800_AddPurchasingRecordsWorkflow', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE TABLE [StockLocations] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Code] nvarchar(50) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetime2 NULL,
        [DeletedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_StockLocations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE TABLE [InventoryTransactions] (
        [Id] uniqueidentifier NOT NULL,
        [StockLocationId] uniqueidentifier NOT NULL,
        [PartId] uniqueidentifier NOT NULL,
        [PurchaseOrderId] uniqueidentifier NULL,
        [PurchaseOrderLineId] uniqueidentifier NULL,
        [TransactionType] int NOT NULL,
        [QuantityDelta] decimal(18,4) NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        [Notes] nvarchar(2000) NULL,
        [OccurredAtUtc] datetime2 NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_InventoryTransactions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InventoryTransactions_Parts_PartId] FOREIGN KEY ([PartId]) REFERENCES [Parts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryTransactions_PurchaseOrderLines_PurchaseOrderLineId] FOREIGN KEY ([PurchaseOrderLineId]) REFERENCES [PurchaseOrderLines] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryTransactions_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InventoryTransactions_StockLocations_StockLocationId] FOREIGN KEY ([StockLocationId]) REFERENCES [StockLocations] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_StockLocations_Code] ON [StockLocations] ([Code]) WHERE [Code] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_StockLocations_IsActive] ON [StockLocations] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_StockLocations_Name] ON [StockLocations] ([Name]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_OccurredAtUtc] ON [InventoryTransactions] ([OccurredAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_PartId] ON [InventoryTransactions] ([PartId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_PurchaseOrderId] ON [InventoryTransactions] ([PurchaseOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_PurchaseOrderLineId] ON [InventoryTransactions] ([PurchaseOrderLineId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_StockLocationId] ON [InventoryTransactions] ([StockLocationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    CREATE INDEX [IX_InventoryTransactions_TransactionType] ON [InventoryTransactions] ([TransactionType]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260525143000_AddAdvancedInventoryPhase1Foundation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260525143000_AddAdvancedInventoryPhase1Foundation', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] DROP CONSTRAINT [FK_JobTicketParts_Parts_PartId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [IsUnlistedPart] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [OfficeOrderNotes] nvarchar(2000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [OfficeOrderRequested] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [OfficeOrderRequestedAtUtc] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [PartNameSnapshot] nvarchar(200) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD [PartNumberSnapshot] nvarchar(100) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    UPDATE jtp
    SET
        PartNumberSnapshot = p.PartNumber,
        PartNameSnapshot = p.Name
    FROM JobTicketParts jtp
    INNER JOIN Parts p ON p.Id = jtp.PartId
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobTicketParts]') AND [c].[name] = N'PartId');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [JobTicketParts] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [JobTicketParts] ALTER COLUMN [PartId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_OfficeOrderRequested] ON [JobTicketParts] ([OfficeOrderRequested]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    CREATE INDEX [IX_JobTicketParts_PartNumberSnapshot] ON [JobTicketParts] ([PartNumberSnapshot]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    ALTER TABLE [JobTicketParts] ADD CONSTRAINT [FK_JobTicketParts_Parts_PartId] FOREIGN KEY ([PartId]) REFERENCES [Parts] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260605003000_AddJobTicketQuickAddPartFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260605003000_AddJobTicketQuickAddPartFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622131510_AddCompanyConfiguration'
)
BEGIN
    CREATE TABLE [CompanyConfigurations] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyName] nvarchar(200) NOT NULL,
        [LegalName] nvarchar(200) NULL,
        [ContactName] nvarchar(200) NULL,
        [Email] nvarchar(320) NULL,
        [Phone] nvarchar(50) NULL,
        [Website] nvarchar(300) NULL,
        [AddressLine1] nvarchar(200) NULL,
        [AddressLine2] nvarchar(200) NULL,
        [City] nvarchar(100) NULL,
        [State] nvarchar(100) NULL,
        [PostalCode] nvarchar(20) NULL,
        [Country] nvarchar(100) NULL,
        [PrimaryColor] nvarchar(7) NOT NULL DEFAULT N'#3157C8',
        [SecondaryColor] nvarchar(7) NOT NULL DEFAULT N'#172033',
        [AccentColor] nvarchar(7) NOT NULL DEFAULT N'#087F5B',
        [LogoStorageKey] nvarchar(1000) NULL,
        [LogoOriginalFileName] nvarchar(255) NULL,
        [LogoContentType] nvarchar(150) NULL,
        [LogoFileExtension] nvarchar(20) NULL,
        [LogoFileSizeBytes] bigint NULL,
        [LogoUploadedAtUtc] datetime2 NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_CompanyConfigurations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622131510_AddCompanyConfiguration'
)
BEGIN
    CREATE INDEX [IX_CompanyConfigurations_UpdatedAtUtc] ON [CompanyConfigurations] ([UpdatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622131510_AddCompanyConfiguration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260622131510_AddCompanyConfiguration', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
    CREATE TABLE [TicketStatusFilterOptions] (
        [Id] uniqueidentifier NOT NULL,
        [DisplayLabel] nvarchar(80) NOT NULL,
        [Status] int NOT NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [UpdatedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketStatusFilterOptions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
    CREATE INDEX [IX_TicketStatusFilterOptions_DisplayOrder] ON [TicketStatusFilterOptions] ([DisplayOrder]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
    CREATE INDEX [IX_TicketStatusFilterOptions_IsActive_DisplayOrder] ON [TicketStatusFilterOptions] ([IsActive], [DisplayOrder]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
    CREATE INDEX [IX_TicketStatusFilterOptions_Status] ON [TicketStatusFilterOptions] ([Status]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260623073000_ConfigurableTicketStatusFilters'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260623073000_ConfigurableTicketStatusFilters', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624133000_AddCustomerBillingParty'
)
BEGIN
    ALTER TABLE [Customers] ADD [BillingPartyCustomerId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624133000_AddCustomerBillingParty'
)
BEGIN
    CREATE INDEX [IX_Customers_BillingPartyCustomerId] ON [Customers] ([BillingPartyCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624133000_AddCustomerBillingParty'
)
BEGIN
    ALTER TABLE [Customers] ADD CONSTRAINT [FK_Customers_Customers_BillingPartyCustomerId] FOREIGN KEY ([BillingPartyCustomerId]) REFERENCES [Customers] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624133000_AddCustomerBillingParty'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260624133000_AddCustomerBillingParty', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624140000_AddJobTicketWorkLocationType'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [LocationType] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624140000_AddJobTicketWorkLocationType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260624140000_AddJobTicketWorkLocationType', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706143027_AddEquipmentCompatibleParts'
)
BEGIN
    CREATE TABLE [EquipmentCompatibleParts] (
        [EquipmentId] uniqueidentifier NOT NULL,
        [PartId] uniqueidentifier NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [IsRecommendedForPM] bit NOT NULL,
        [AddedByUserId] uniqueidentifier NOT NULL,
        [AddedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_EquipmentCompatibleParts] PRIMARY KEY ([EquipmentId], [PartId]),
        CONSTRAINT [FK_EquipmentCompatibleParts_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_EquipmentCompatibleParts_Parts_PartId] FOREIGN KEY ([PartId]) REFERENCES [Parts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706143027_AddEquipmentCompatibleParts'
)
BEGIN
    CREATE INDEX [IX_EquipmentCompatibleParts_EquipmentId] ON [EquipmentCompatibleParts] ([EquipmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706143027_AddEquipmentCompatibleParts'
)
BEGIN
    CREATE INDEX [IX_EquipmentCompatibleParts_PartId] ON [EquipmentCompatibleParts] ([PartId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706143027_AddEquipmentCompatibleParts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706143027_AddEquipmentCompatibleParts', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706144301_AddEstimatedDuration'
)
BEGIN
    ALTER TABLE [JobTickets] ADD [EstimatedDurationMinutes] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706144301_AddEstimatedDuration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706144301_AddEstimatedDuration', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706145848_MakeClockCoordsOptional'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TimeEntries]') AND [c].[name] = N'ClockInLongitude');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [TimeEntries] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [TimeEntries] ALTER COLUMN [ClockInLongitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706145848_MakeClockCoordsOptional'
)
BEGIN
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[TimeEntries]') AND [c].[name] = N'ClockInLatitude');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [TimeEntries] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [TimeEntries] ALTER COLUMN [ClockInLatitude] decimal(9,6) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706145848_MakeClockCoordsOptional'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706145848_MakeClockCoordsOptional', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706165617_AddNewTicketNotificationRecipients'
)
BEGIN
    ALTER TABLE [CompanyConfigurations] ADD [NewTicketNotificationMinimumPriority] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706165617_AddNewTicketNotificationRecipients'
)
BEGIN
    ALTER TABLE [CompanyConfigurations] ADD [NewTicketNotificationsEnabled] bit NOT NULL DEFAULT CAST(1 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706165617_AddNewTicketNotificationRecipients'
)
BEGIN
    CREATE TABLE [NewTicketNotificationRecipients] (
        [Id] uniqueidentifier NOT NULL,
        [Label] nvarchar(200) NOT NULL,
        [Email] nvarchar(320) NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [AddedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_NewTicketNotificationRecipients] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706165617_AddNewTicketNotificationRecipients'
)
BEGIN
    CREATE INDEX [IX_NewTicketNotificationRecipients_IsActive] ON [NewTicketNotificationRecipients] ([IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706165617_AddNewTicketNotificationRecipients'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706165617_AddNewTicketNotificationRecipients', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706173148_AddPartOrderRequestsEmailToCompanyConfig'
)
BEGIN
    ALTER TABLE [CompanyConfigurations] ADD [PartOrderRequestsEmail] nvarchar(320) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706173148_AddPartOrderRequestsEmailToCompanyConfig'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706173148_AddPartOrderRequestsEmailToCompanyConfig', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706195516_AddTimeEntryType'
)
BEGIN
    ALTER TABLE [TimeEntries] ADD [EntryType] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260706195516_AddTimeEntryType'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260706195516_AddTimeEntryType', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707224204_AddMailerConfiguration'
)
BEGIN
    CREATE TABLE [MailerConfigurations] (
        [Id] uniqueidentifier NOT NULL,
        [Provider] int NOT NULL,
        [Enabled] bit NOT NULL DEFAULT CAST(0 AS bit),
        [FromName] nvarchar(200) NULL,
        [FromAddress] nvarchar(320) NULL,
        [ReplyToAddress] nvarchar(320) NULL,
        [SmtpHost] nvarchar(255) NULL,
        [SmtpPort] int NOT NULL DEFAULT 587,
        [SmtpEnableSsl] bit NOT NULL DEFAULT CAST(1 AS bit),
        [SmtpUsername] nvarchar(320) NULL,
        [SmtpPasswordCipherText] nvarchar(4000) NULL,
        [AppBaseUrl] nvarchar(300) NULL,
        [LastTestedAtUtc] datetime2 NULL,
        [LastTestSucceeded] bit NULL,
        [LastTestMessage] nvarchar(1000) NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_MailerConfigurations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707224204_AddMailerConfiguration'
)
BEGIN
    CREATE INDEX [IX_MailerConfigurations_UpdatedAtUtc] ON [MailerConfigurations] ([UpdatedAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707224204_AddMailerConfiguration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260707224204_AddMailerConfiguration', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707230412_AddMicrosoft365GraphMailerSettings'
)
BEGIN
    ALTER TABLE [MailerConfigurations] ADD [Microsoft365ClientId] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707230412_AddMicrosoft365GraphMailerSettings'
)
BEGIN
    ALTER TABLE [MailerConfigurations] ADD [Microsoft365ClientSecretCipherText] nvarchar(4000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707230412_AddMicrosoft365GraphMailerSettings'
)
BEGIN
    ALTER TABLE [MailerConfigurations] ADD [Microsoft365SenderEmail] nvarchar(320) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707230412_AddMicrosoft365GraphMailerSettings'
)
BEGIN
    ALTER TABLE [MailerConfigurations] ADD [Microsoft365TenantId] nvarchar(200) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707230412_AddMicrosoft365GraphMailerSettings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260707230412_AddMicrosoft365GraphMailerSettings', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708022409_AddApplicationErrorLogs'
)
BEGIN
    CREATE TABLE [ApplicationErrorLogs] (
        [Id] uniqueidentifier NOT NULL,
        [OccurredAtUtc] datetime2 NOT NULL,
        [Severity] nvarchar(40) NOT NULL,
        [Source] nvarchar(80) NOT NULL,
        [Message] nvarchar(2000) NOT NULL,
        [Cause] nvarchar(2000) NULL,
        [Location] nvarchar(1000) NULL,
        [RequestPath] nvarchar(1000) NULL,
        [RequestMethod] nvarchar(20) NULL,
        [UserId] uniqueidentifier NULL,
        [UserRole] nvarchar(50) NULL,
        [UserAgent] nvarchar(1000) NULL,
        [StackTrace] nvarchar(max) NULL,
        [MetadataJson] nvarchar(max) NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ApplicationErrorLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708022409_AddApplicationErrorLogs'
)
BEGIN
    CREATE INDEX [IX_ApplicationErrorLogs_OccurredAtUtc] ON [ApplicationErrorLogs] ([OccurredAtUtc]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708022409_AddApplicationErrorLogs'
)
BEGIN
    CREATE INDEX [IX_ApplicationErrorLogs_RequestPath] ON [ApplicationErrorLogs] ([RequestPath]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708022409_AddApplicationErrorLogs'
)
BEGIN
    CREATE INDEX [IX_ApplicationErrorLogs_Source] ON [ApplicationErrorLogs] ([Source]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708022409_AddApplicationErrorLogs'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260708022409_AddApplicationErrorLogs', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708124517_CleanMailerOptionsAndModelWarnings'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[JobTicketParts]') AND [c].[name] = N'ApprovalStatus');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [JobTicketParts] DROP CONSTRAINT [' + @var8 + '];');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708124517_CleanMailerOptionsAndModelWarnings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260708124517_CleanMailerOptionsAndModelWarnings', N'8.0.0');
END;
GO

COMMIT;
GO


