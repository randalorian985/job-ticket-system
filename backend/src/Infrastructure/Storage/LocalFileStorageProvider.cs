namespace JobTicketSystem.Infrastructure.Storage;

public sealed class LocalFileStorageProvider(LocalFileStorageOptions options) : IFileStorageProvider
{
    private readonly string rootPath = Path.GetFullPath(options.RootPath);

    public string GenerateStorageKey(Guid jobTicketId, string originalFileName, string extension)
    {
        var sanitizedExtension = SanitizeExtension(extension);
        var safeFileName = Path.GetFileNameWithoutExtension(originalFileName);
        var normalizedName = string.Concat(safeFileName.Where(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_'));
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            normalizedName = "file";
        }

        var year = DateTime.UtcNow.Year.ToString();
        var month = DateTime.UtcNow.Month.ToString("00");
        var unique = Guid.NewGuid().ToString("N");
        return Path.Combine("job-tickets", year, month, jobTicketId.ToString("N"), $"{unique}_{normalizedName}{sanitizedExtension}")
            .Replace('\\', '/');
    }

    public async Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolvePath(storageKey);
        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        if (content.CanSeek)
        {
            content.Position = 0;
        }

        await using var output = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(output, cancellationToken);
    }

    public Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        var fullPath = ResolvePath(storageKey);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Storage key was not found: {storageKey}", fullPath);
        }

        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    private string ResolvePath(string storageKey)
    {
        var normalizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(rootPath, normalizedKey));
        if (!fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Storage key resolved outside configured root path.");
        }

        return fullPath;
    }

    private static string SanitizeExtension(string extension)
    {
        if (string.IsNullOrWhiteSpace(extension))
        {
            return ".bin";
        }

        var normalized = extension.Trim().ToLowerInvariant();
        if (!normalized.StartsWith('.'))
        {
            normalized = $".{normalized}";
        }

        return string.Concat(normalized.Where(ch => char.IsLetterOrDigit(ch) || ch == '.'));
    }
}

public sealed record LocalFileStorageOptions(string RootPath);
