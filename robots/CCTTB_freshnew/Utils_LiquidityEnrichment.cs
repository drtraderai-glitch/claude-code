using System;
using System.Collections.Generic;
using System.Linq;
using cAlgo.API;

namespace CCTTB
{
    /// <summary>
    /// Enriches liquidity zones with entry tool detection (OTE/OB/FVG/BB).
    /// Helps identify high-quality entry zones with multiple confirmation tools.
    /// DOES NOT CHANGE CORE LOGIC: SWEEP → MSS → LIQUIDITY → ENTRY TOOL → ENTRY
    /// </summary>
    public class LiquidityEnrichment
    {
        private readonly double _pipSize;

        public LiquidityEnrichment(double pipSize)
        {
            _pipSize = pipSize;
        }

        /// <summary>
        /// Get proximity tolerance based on timeframe (in price units)
        /// </summary>
        private double GetProximityTolerance(TimeFrame tf, double atrValue)
        {
            // Timeframe-aware tolerance for "nearby" detection
            if (tf == TimeFrame.Minute) return atrValue * 0.3;      // 30% ATR (~5-10 pips on M1)
            if (tf == TimeFrame.Minute5) return atrValue * 0.5;     // 50% ATR (~15 pips on M5)
            if (tf == TimeFrame.Minute15) return atrValue * 0.7;    // 70% ATR (~20 pips on M15)
            if (tf == TimeFrame.Hour) return atrValue * 1.0;        // 100% ATR (~30 pips on H1)
            if (tf == TimeFrame.Hour4) return atrValue * 1.5;       // 150% ATR (~50 pips on H4)
            return atrValue * 2.0;                                   // 200% ATR for higher TFs
        }

        /// <summary>
        /// Enrich liquidity zones with entry tool detection.
        /// Marks which zones have OTE/OB/FVG/BB nearby or inside them.
        /// </summary>
        public void EnrichLiquidityWithEntryTools(
            List<LiquidityZone> liquidityZones,
            List<OTEZone> oteZones,
            List<OrderBlock> orderBlocks,
            List<FVGZone> fvgZones,
            List<BreakerBlock> breakerBlocks,
            TimeFrame timeframe,
            double atrValue)
        {
            if (liquidityZones == null || liquidityZones.Count == 0) return;

            double tolerance = GetProximityTolerance(timeframe, atrValue);

            foreach (var liq in liquidityZones)
            {
                // Reset enrichment flags
                liq.HasOTE = false;
                liq.HasOrderBlock = false;
                liq.HasFVG = false;
                liq.HasBreakerBlock = false;
                liq.EntryTools.Clear();

                // Check OTE overlap/proximity
                if (oteZones != null)
                {
                    foreach (var ote in oteZones)
                    {
                        // OTE uses OTE618 (bottom) and OTE79 (top) for range
                        double oteLow = Math.Min(ote.OTE618, ote.OTE79);
                        double oteHigh = Math.Max(ote.OTE618, ote.OTE79);

                        if (IsNearOrInside(liq, oteLow, oteHigh, tolerance))
                        {
                            liq.HasOTE = true;
                            liq.EntryTools.Add($"OTE {ote.Direction}");
                            break; // Only mark once
                        }
                    }
                }

                // Check Order Block overlap/proximity
                if (orderBlocks != null)
                {
                    foreach (var ob in orderBlocks)
                    {
                        if (IsNearOrInside(liq, ob.LowPrice, ob.HighPrice, tolerance))
                        {
                            liq.HasOrderBlock = true;
                            liq.EntryTools.Add($"OB {ob.Direction}");
                            break;
                        }
                    }
                }

                // Check FVG overlap/proximity
                if (fvgZones != null)
                {
                    foreach (var fvg in fvgZones)
                    {
                        if (IsNearOrInside(liq, fvg.Low, fvg.High, tolerance))
                        {
                            liq.HasFVG = true;
                            liq.EntryTools.Add($"FVG {fvg.Direction}");
                            break;
                        }
                    }
                }

                // Check Breaker Block overlap/proximity
                if (breakerBlocks != null)
                {
                    foreach (var bb in breakerBlocks)
                    {
                        if (IsNearOrInside(liq, bb.LowPrice, bb.HighPrice, tolerance))
                        {
                            liq.HasBreakerBlock = true;
                            liq.EntryTools.Add($"BB {bb.Direction}");
                            break;
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Check if entry tool zone is near or inside liquidity zone
        /// </summary>
        private bool IsNearOrInside(LiquidityZone liq, double toolLow, double toolHigh, double tolerance)
        {
            // Entry tool is completely inside liquidity
            if (toolLow >= liq.Low && toolHigh <= liq.High) return true;

            // Liquidity is completely inside entry tool
            if (liq.Low >= toolLow && liq.High <= toolHigh) return true;

            // Partial overlap
            if ((toolLow >= liq.Low && toolLow <= liq.High) ||
                (toolHigh >= liq.Low && toolHigh <= liq.High)) return true;

            // Check proximity (within tolerance)
            double distanceToLiq = Math.Min(
                Math.Abs(toolLow - liq.High),    // Distance from tool bottom to liq top
                Math.Abs(toolHigh - liq.Low)     // Distance from tool top to liq bottom
            );

            return distanceToLiq <= tolerance;
        }

        /// <summary>
        /// Filter liquidity zones based on quality, recency, and distance from price.
        /// Removes old zones, zones too far away, and prioritizes zones with entry tools.
        /// </summary>
        public List<LiquidityZone> FilterForDisplay(
            List<LiquidityZone> zones,
            double currentPrice,
            TimeFrame timeframe,
            int maxZones = 15)
        {
            if (zones == null || zones.Count == 0) return zones;

            // Get timeframe-aware filter parameters
            var (maxAgeMinutes, maxDistancePips) = GetFilterParams(timeframe);

            DateTime cutoffTime = DateTime.UtcNow.AddMinutes(-maxAgeMinutes);
            double maxDistancePrice = maxDistancePips * _pipSize;

            var filtered = zones
                // Remove old zones
                .Where(z => z.Start >= cutoffTime)
                // Remove zones too far from current price
                .Where(z => Math.Abs(z.Mid - currentPrice) <= maxDistancePrice)
                // Sort by quality (entry tool count) then recency
                .OrderByDescending(z => z.EntryToolCount)
                .ThenByDescending(z => z.Start)
                // Limit count
                .Take(maxZones)
                .ToList();

            return filtered;
        }

        /// <summary>
        /// Get max age and max distance based on timeframe
        /// </summary>
        private (int maxAgeMinutes, double maxDistancePips) GetFilterParams(TimeFrame tf)
        {
            // Timeframe → (Max Age in Minutes, Max Distance in Pips)
            if (tf == TimeFrame.Minute) return (30, 30);        // M1: 30 min, 30 pips
            if (tf == TimeFrame.Minute5) return (120, 50);      // M5: 2 hours, 50 pips
            if (tf == TimeFrame.Minute15) return (300, 80);     // M15: 5 hours, 80 pips
            if (tf == TimeFrame.Hour) return (1440, 150);       // H1: 1 day, 150 pips
            if (tf == TimeFrame.Hour4) return (4320, 250);      // H4: 3 days, 250 pips
            return (10080, 400);                                 // Daily+: 1 week, 400 pips
        }
    }
}
