export const Constants = {
  U_OPTIMAL: 80_00,
  U_RESERVE: 90_00,
  R_BASE: 2_00,
  R_SLOPE_1: 5_00,
  R_SLOPE_2: 40_00,
  R_SLOPE_3: 75_00,
  LIQUIDATION_THRESOLD: 1000,
  EXPECTED_LIQUIDITY_LIMIT: 10_000_000_000,
  WITHDRAW_FEE: 1_00,
  tokens: [
    {
      token: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      liquidationThreshold: 10_00,
    },
    // {
    //     token: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    //     liquidationThreshold: 10_00
    // }
  ],
} as const;
