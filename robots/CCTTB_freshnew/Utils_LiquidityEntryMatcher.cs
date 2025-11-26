// File: Utils_LiquidityEntryMatcher.cs
using System;
using System.Collections.Generic;
using System.Linq;
using cAlgo.API;

namespace CCTTB
{
    /// <summary>
    /// High-Conviction Quantitative Entry Model
    ///
    /// Core Philosophy: Liquidity is the FUEL for price movement.
    /// Entry tools (OTE, OB, FVG, BB) are only valid when NEAR strong liquidity.
    ///
    /// This class implements:
    /// 1. Liquidity Clustering (group nearby liquidity zones)
    /// 2. Liquidity Ranking (Strong vs Medium categorization)
    /// 3. Proximity-Based Entry Tool Matching
    /// 4. Single Best Tool Selection per cluster
    /// </summary>
    public class LiquidityEntryMatcher
    {
        private readonly Symbol _symbol;

        public LiquidityEntryMatcher(Symbol symbol)
        {
            _symbol = symbol;
        }

        /// <summary>
        /// Liquidity Strength Categories
        /// </summary>
        public enum LiquidityStrength
        {
            Strong,   // PDH/PDL, PWH/PWL, EQH/EQL, Major Swings
            Medium,   // Session highs/lows, Internal Range
            Weak      // Minor pivots (filtered out)
        }

        /// <summary>
        /// Entry Tool Proximity Categories
        /// </summary>
        public enum ProximityType
        {
            Inside,   // Liquidity inside tool (BEST ⭐⭐⭐)
            Near,     // Within 5-10 pips (GOOD ⭐⭐)
            Above,    // Liquidity above tool (for bearish)
            Below,    // Liquidity below tool (for bullish)
            Far       // Too far away (FILTERED ❌)
        }

        /// <summary>
        /// Liquidity Cluster - represents a group of nearby liquidity zones
        /// </summary>
        public class LiquidityCluster
        {
            public List<LiquidityZone> Zones { get; set; } = new List<LiquidityZone>();
            public LiquidityZone StrongestZone { get; set; }
            public LiquidityStrength Strength { get; set; }
            public double CenterPrice { get; set; }
            public double MinPrice { get; set; }
            public double MaxPrice { get; set; }
        }

        /// <summary>
        /// Entry Tool Match Result
        /// </summary>
        public class EntryToolMatch
        {
            public object EntryTool { get; set; }  // OTEZone, OrderBlock, FVGZone, or BreakerBlock
            public string ToolType { get; set; }    // "OTE", "OB", "FVG", "BB"
            public LiquidityCluster Cluster { get; set; }
            public ProximityType Proximity { get; set; }
            public double ProximityScore { get; set; }  // Higher = better
            public string MatchLabel { get; set; }  // "OTE @ PDH", "OB @ PWL", etc.
        }

        /// <summary>
        /// Categorize liquidity strength based on ICT institutional logic
        /// </summary>
        public LiquidityStrength CategorizeLiquidityStrength(LiquidityZone zone)
        {
            if (zone == null || string.IsNullOrEmpty(zone.Label))
                return LiquidityStrength.Weak;

            var label = zone.Label.ToUpper();

            // ✅ STRONG: Major institutional liquidity (high-probability targets)
            if (label.Contains("PDH") || label.Contains("PDL") ||  // Previous Day
                label.Contains("PWH") || label.Contains("PWL") ||  // Previous Week
                label.Contains("PMH") || label.Contains("PML") ||  // Previous Month
                label.Contains("EQH") || label.Contains("EQL") ||  // Equal Highs/Lows
                label.Contains("DOUBLE TOP") || label.Contains("DOUBLE BOTTOM"))
            {
                return LiquidityStrength.Strong;
            }

            // ⭐ MEDIUM: Session/Internal liquidity (inducement/fuel for moves)
            if (label.Contains("CDH") || label.Contains("CDL") ||  // Current Day
                label.Contains("ASIA") || label.Contains("LONDON") || label.Contains("NY") ||  // Session
                label.Contains("INTERNAL") || label.Contains("IRL"))  // Internal Range
            {
                return LiquidityStrength.Medium;
            }

            // Filter out weak/minor pivots (too many, low probability)
            if (label.Contains("MINOR") || label.Contains("WEAK"))
            {
                return LiquidityStrength.Weak;
            }

            // Default: Swing highs/lows are Medium unless proven Strong
            return LiquidityStrength.Medium;
        }

        /// <summary>
        /// Cluster nearby liquidity zones (when 3+ zones are within clustering distance)
        /// </summary>
        public List<LiquidityCluster> ClusterLiquidity(List<LiquidityZone> zones)
        {
            if (zones == null || zones.Count == 0)
                return new List<LiquidityCluster>();

            var clusters = new List<LiquidityCluster>();
            var used = new HashSet<LiquidityZone>();

            // Clustering distance: 10-20 pips based on timeframe
            double clusteringDistance = _symbol.PipSize * 15;

            foreach (var zone in zones)
            {
                if (used.Contains(zone)) continue;

                var cluster = new LiquidityCluster();
                cluster.Zones.Add(zone);
                used.Add(zone);

                double zoneCenter = (zone.Low + zone.High) / 2;

                // Find all nearby zones within clustering distance
                foreach (var other in zones)
                {
                    if (used.Contains(other)) continue;

                    double otherCenter = (other.Low + other.High) / 2;
                    double distance = Math.Abs(zoneCenter - otherCenter);

                    if (distance <= clusteringDistance)
                    {
                        cluster.Zones.Add(other);
                        used.Add(other);
                    }
                }

                // Calculate cluster metrics
                cluster.MinPrice = cluster.Zones.Min(z => z.Low);
                cluster.MaxPrice = cluster.Zones.Max(z => z.High);
                cluster.CenterPrice = (cluster.MinPrice + cluster.MaxPrice) / 2;

                // Find strongest zone in cluster (PDH > PWH > EQH > Swing)
                cluster.StrongestZone = FindStrongestZone(cluster.Zones);
                cluster.Strength = CategorizeLiquidityStrength(cluster.StrongestZone);

                clusters.Add(cluster);
            }

            return clusters;
        }

        /// <summary>
        /// Find the strongest liquidity zone in a list based on ICT priority
        /// </summary>
        private LiquidityZone FindStrongestZone(List<LiquidityZone> zones)
        {
            if (zones == null || zones.Count == 0) return null;
            if (zones.Count == 1) return zones[0];

            // Priority ranking (higher = stronger)
            int GetPriority(LiquidityZone z)
            {
                var label = z.Label?.ToUpper() ?? "";
                if (label.Contains("PDH") || label.Contains("PDL")) return 100;  // Previous Day (highest)
                if (label.Contains("PWH") || label.Contains("PWL")) return 90;   // Previous Week
                if (label.Contains("PMH") || label.Contains("PML")) return 85;   // Previous Month
                if (label.Contains("EQH") || label.Contains("EQL")) return 80;   // Equal Highs/Lows
                if (label.Contains("CDH") || label.Contains("CDL")) return 70;   // Current Day
                if (label.Contains("DOUBLE")) return 75;                         // Double Top/Bottom
                if (label.Contains("SWING HIGH") || label.Contains("SWING LOW")) return 50;
                return 40;  // Minor/other
            }

            return zones.OrderByDescending(GetPriority).First();
        }

        /// <summary>
        /// Calculate proximity between entry tool and liquidity zone
        /// </summary>
        public ProximityType CalculateProximity(double toolLow, double toolHigh, LiquidityCluster cluster, BiasDirection direction)
        {
            double toolCenter = (toolLow + toolHigh) / 2;
            double liqCenter = cluster.CenterPrice;
            double distance = Math.Abs(toolCenter - liqCenter);

            // Proximity thresholds (pips)
            double insideThreshold = _symbol.PipSize * 2;   // Overlap tolerance
            double nearThreshold = _symbol.PipSize * 10;    // Near threshold
            double maxThreshold = _symbol.PipSize * 30;     // Maximum distance

            // Check if overlapping (INSIDE)
            bool overlaps = (toolLow <= cluster.MaxPrice && toolHigh >= cluster.MinPrice);
            if (overlaps || distance <= insideThreshold)
                return ProximityType.Inside;

            // Check if NEAR (within 10 pips)
            if (distance <= nearThreshold)
            {
                // Determine if above or below
                if (direction == BiasDirection.Bearish && liqCenter < toolCenter)
                    return ProximityType.Below;  // Liquidity below tool (valid for bearish)
                else if (direction == BiasDirection.Bullish && liqCenter > toolCenter)
                    return ProximityType.Above;  // Liquidity above tool (valid for bullish)
                else
                    return ProximityType.Near;
            }

            // Check if within maximum acceptable distance
            if (distance <= maxThreshold)
            {
                if (direction == BiasDirection.Bearish && liqCenter < toolCenter)
                    return ProximityType.Below;
                else if (direction == BiasDirection.Bullish && liqCenter > toolCenter)
                    return ProximityType.Above;
                else
                    return ProximityType.Near;
            }

            // Too far away
            return ProximityType.Far;
        }

        /// <summary>
        /// Calculate proximity score (higher = better match)
        /// </summary>
        public double CalculateProximityScore(ProximityType proximity, LiquidityStrength strength)
        {
            double proximityScore = proximity switch
            {
                ProximityType.Inside => 100,  // Best: Entry tool overlaps liquidity
                ProximityType.Near => 80,     // Good: Very close
                ProximityType.Above => 60,    // OK: Above (for bullish)
                ProximityType.Below => 60,    // OK: Below (for bearish)
                ProximityType.Far => 0,       // Filtered out
                _ => 0
            };

            double strengthMultiplier = strength switch
            {
                LiquidityStrength.Strong => 1.5,   // Prefer strong liquidity
                LiquidityStrength.Medium => 1.0,
                LiquidityStrength.Weak => 0.5,
                _ => 1.0
            };

            return proximityScore * strengthMultiplier;
        }

        /// <summary>
        /// Match OTE zones to liquidity clusters and return only the best match per cluster
        /// </summary>
        public List<EntryToolMatch> MatchOTEToLiquidity(
            List<OTEZone> oteZones,
            List<LiquidityCluster> clusters)
        {
            var matches = new List<EntryToolMatch>();

            if (oteZones == null || clusters == null || oteZones.Count == 0 || clusters.Count == 0)
                return matches;

            // For each strong liquidity cluster
            foreach (var cluster in clusters.Where(c => c.Strength == LiquidityStrength.Strong))
            {
                EntryToolMatch bestMatch = null;
                double bestScore = 0;

                // Find the best matching OTE for this cluster
                foreach (var ote in oteZones)
                {
                    var proximity = CalculateProximity(ote.Low, ote.High, cluster, ote.Direction);

                    // Filter out tools that are too far
                    if (proximity == ProximityType.Far)
                        continue;

                    double score = CalculateProximityScore(proximity, cluster.Strength);

                    if (score > bestScore)
                    {
                        bestScore = score;
                        bestMatch = new EntryToolMatch
                        {
                            EntryTool = ote,
                            ToolType = "OTE",
                            Cluster = cluster,
                            Proximity = proximity,
                            ProximityScore = score,
                            MatchLabel = $"OTE @ {cluster.StrongestZone.Label}"
                        };
                    }
                }

                // Add the best match for this cluster (if any)
                if (bestMatch != null)
                    matches.Add(bestMatch);
            }

            return matches;
        }

        /// <summary>
        /// Filter OTE zones to show only those that match strong liquidity
        /// Returns ONLY the OTE zones that should be plotted
        /// </summary>
        public List<OTEZone> FilterOTEByLiquidity(
            List<OTEZone> oteZones,
            List<LiquidityZone> liquidityZones)
        {
            if (oteZones == null || liquidityZones == null || oteZones.Count == 0 || liquidityZones.Count == 0)
                return new List<OTEZone>();

            // Step 1: Cluster liquidity zones
            var clusters = ClusterLiquidity(liquidityZones);

            // Step 2: Match OTE to liquidity clusters
            var matches = MatchOTEToLiquidity(oteZones, clusters);

            // Step 3: Extract only the matched OTE zones
            var filteredOTE = matches
                .Select(m => m.EntryTool as OTEZone)
                .Where(ote => ote != null)
                .ToList();

            return filteredOTE;
        }
    }
}
