using GemelliPrintAgent.Models;
using Microsoft.Data.Sqlite;

namespace GemelliPrintAgent.Services;

public class LocalQueueService
{
    private readonly string _connectionString;

    public LocalQueueService()
    {
        var dataPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "GemelliPrintAgent"
        );
        var dbPath = Path.Combine(dataPath, "queue.db");
        _connectionString = $"Data Source={dbPath}";
        
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                pc_name TEXT NOT NULL,
                pc_ip TEXT NOT NULL,
                username_windows TEXT NOT NULL,
                printer_name TEXT NOT NULL,
                job_id TEXT,
                document_name TEXT NOT NULL,
                pages_printed INTEGER NOT NULL,
                copies INTEGER NOT NULL,
                duplex INTEGER,
                color INTEGER,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                sent INTEGER DEFAULT 0
            )
        ";
        command.ExecuteNonQuery();
    }

    public void EnqueueJob(PrintJob job)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO queue (
                timestamp, pc_name, pc_ip, username_windows, printer_name,
                job_id, document_name, pages_printed, copies, duplex, color,
                status, created_at
            ) VALUES (
                @timestamp, @pc_name, @pc_ip, @username_windows, @printer_name,
                @job_id, @document_name, @pages_printed, @copies, @duplex, @color,
                @status, @created_at
            )
        ";

        command.Parameters.AddWithValue("@timestamp", job.Timestamp.ToString("o"));
        command.Parameters.AddWithValue("@pc_name", job.PcName);
        command.Parameters.AddWithValue("@pc_ip", job.PcIp);
        command.Parameters.AddWithValue("@username_windows", job.UsernameWindows);
        command.Parameters.AddWithValue("@printer_name", job.PrinterName);
        command.Parameters.AddWithValue("@job_id", job.JobId ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@document_name", job.DocumentName);
        command.Parameters.AddWithValue("@pages_printed", job.PagesPrinted);
        command.Parameters.AddWithValue("@copies", job.Copies);
        command.Parameters.AddWithValue("@duplex", job.Duplex.HasValue ? (job.Duplex.Value ? 1 : 0) : (object)DBNull.Value);
        command.Parameters.AddWithValue("@color", job.Color.HasValue ? (job.Color.Value ? 1 : 0) : (object)DBNull.Value);
        command.Parameters.AddWithValue("@status", job.Status);
        command.Parameters.AddWithValue("@created_at", DateTime.Now.ToString("o"));

        command.ExecuteNonQuery();
    }

    public List<QueuedJob> GetPendingJobs(int limit = 50)
    {
        var jobs = new List<QueuedJob>();

        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM queue WHERE sent = 0 ORDER BY id LIMIT @limit";
        command.Parameters.AddWithValue("@limit", limit);

        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            jobs.Add(new QueuedJob
            {
                Id = reader.GetInt32(0),
                Timestamp = DateTime.Parse(reader.GetString(1)),
                PcName = reader.GetString(2),
                PcIp = reader.GetString(3),
                UsernameWindows = reader.GetString(4),
                PrinterName = reader.GetString(5),
                JobId = reader.IsDBNull(6) ? null : reader.GetString(6),
                DocumentName = reader.GetString(7),
                PagesPrinted = reader.GetInt32(8),
                Copies = reader.GetInt32(9),
                Duplex = reader.IsDBNull(10) ? null : reader.GetInt32(10) == 1,
                Color = reader.IsDBNull(11) ? null : reader.GetInt32(11) == 1,
                Status = reader.GetString(12)
            });
        }

        return jobs;
    }

    public void MarkAsSent(List<int> ids)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = $"UPDATE queue SET sent = 1 WHERE id IN ({string.Join(",", ids)})";
        command.ExecuteNonQuery();
    }

    public void DeleteSentJobs(int olderThanDays = 30)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        var command = connection.CreateCommand();
        command.CommandText = @"
            DELETE FROM queue 
            WHERE sent = 1 
            AND datetime(created_at) < datetime('now', '-' || @days || ' days')
        ";
        command.Parameters.AddWithValue("@days", olderThanDays);
        command.ExecuteNonQuery();
    }
}
