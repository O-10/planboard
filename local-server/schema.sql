-- ============================================================
--  Planboard · Esquema para SQL Server
--  Ejecuta esto una sola vez (por ejemplo con SSMS o sqlcmd).
--  El servidor local también lo aplica solo al arrancar.
-- ============================================================

IF DB_ID('Planboard') IS NULL
BEGIN
    CREATE DATABASE Planboard;
END
GO

USE Planboard;
GO

IF OBJECT_ID('dbo.Boards', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Boards
    (
        ShareId   VARCHAR(64)    NOT NULL CONSTRAINT PK_Boards PRIMARY KEY,
        Payload   NVARCHAR(MAX)  NOT NULL,
        UpdatedAt DATETIME2(3)   NOT NULL CONSTRAINT DF_Boards_UpdatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO
