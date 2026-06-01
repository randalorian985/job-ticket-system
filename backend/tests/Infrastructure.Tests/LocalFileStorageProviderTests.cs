using System.Text;
using JobTicketSystem.Infrastructure.Storage;
using Xunit;

namespace JobTicketSystem.Infrastructure.Tests;

public sealed class LocalFileStorageProviderTests
{
    [Fact]
    public async Task Save_rejects_storage_keys_that_escape_to_sibling_prefix_paths()
    {
        var baseDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        var rootPath = Path.Combine(baseDirectory, "storage");
        var escapedPath = Path.Combine(baseDirectory, "storage-outside", "escape.txt");
        var provider = new LocalFileStorageProvider(new LocalFileStorageOptions(rootPath));

        try
        {
            await using var content = new MemoryStream(Encoding.UTF8.GetBytes("escape"));

            await Assert.ThrowsAsync<InvalidOperationException>(() => provider.SaveAsync("../storage-outside/escape.txt", content));
            Assert.False(File.Exists(escapedPath));
        }
        finally
        {
            if (Directory.Exists(baseDirectory))
            {
                Directory.Delete(baseDirectory, recursive: true);
            }
        }
    }

    [Fact]
    public async Task Save_allows_storage_keys_inside_configured_root_path()
    {
        var baseDirectory = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));
        var rootPath = Path.Combine(baseDirectory, "storage");
        var provider = new LocalFileStorageProvider(new LocalFileStorageOptions(rootPath));

        try
        {
            await using var content = new MemoryStream(Encoding.UTF8.GetBytes("safe"));

            await provider.SaveAsync("job-tickets/2026/06/file.txt", content);

            Assert.True(File.Exists(Path.Combine(rootPath, "job-tickets", "2026", "06", "file.txt")));
        }
        finally
        {
            if (Directory.Exists(baseDirectory))
            {
                Directory.Delete(baseDirectory, recursive: true);
            }
        }
    }
}
