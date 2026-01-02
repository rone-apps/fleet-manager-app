import { Grid, Card, CardContent, Box, Typography } from "@mui/material";
import {
  Category as CategoryIcon,
  TrendingUp as RevenueIcon,
  Assignment as PlanIcon,
  AttachMoney as MoneyIcon,
  CreditCard as MerchantIcon,
} from "@mui/icons-material";

export default function FinancialStats({ stats }) {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CategoryIcon color="error" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Expense Categories
                </Typography>
                <Typography variant="h5">{stats.expenseCategories}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RevenueIcon color="success" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Revenue Categories
                </Typography>
                <Typography variant="h5">{stats.revenueCategories}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PlanIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Lease Plans
                </Typography>
                <Typography variant="h5">{stats.leasePlans}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Lease Rates
                </Typography>
                <Typography variant="h5">{stats.leaseRates}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="secondary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Rate Overrides
                </Typography>
                <Typography variant="h5">{stats.leaseRateOverrides}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MerchantIcon color="info" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Merchant Mappings
                </Typography>
                <Typography variant="h5">{stats.merchantMappings}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
