using System;
using System.Collections.Generic;

namespace CCTTB
{
    public enum LiquidityZoneType { Supply, Demand }

    public class LiquidityZone
    {
        public DateTime Start { get; set; }
        public DateTime End   { get; set; }
        public double Low     { get; set; }
        public double High    { get; set; }
        public LiquidityZoneType Type { get; set; }
        public string Label   { get; set; }

        public bool Bullish => Type == LiquidityZoneType.Demand;

        // --- Helpers ---
        public double Mid  => (Low + High) * 0.5;
        public double Range => High - Low;
        public bool IsActive(DateTime t) => t >= Start && t <= End;
        public string Id => $"LQZ_{Start.Ticks}";

        // --- ENRICHMENT: Entry Tool Detection ---
        public bool HasOTE { get; set; }
        public bool HasOrderBlock { get; set; }
        public bool HasFVG { get; set; }
        public bool HasBreakerBlock { get; set; }

        // Quality score based on number of entry tools present
        public int EntryToolCount =>
            (HasOTE ? 1 : 0) +
            (HasOrderBlock ? 1 : 0) +
            (HasFVG ? 1 : 0) +
            (HasBreakerBlock ? 1 : 0);

        // Quality label for display
        public string QualityLabel
        {
            get
            {
                return EntryToolCount switch
                {
                    4 => "⭐⭐⭐ PREMIUM",
                    3 => "⭐⭐ EXCELLENT",
                    2 => "⭐ GOOD",
                    1 => "✓ STANDARD",
                    _ => "○ BASIC"
                };
            }
        }

        // Entry tool details (for tooltips/labels)
        public List<string> EntryTools { get; set; } = new List<string>();
    }
}
