"use client";

import { useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from "@mui/material";
import { 
  Payment as PaymentIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDate, getStatusColor } from "../../utils/helpers";

export default function InvoiceDetailsDialog({
  open,
  onClose,
  selectedInvoice,
  canMarkPaid,
  handleOpenRecordPaymentDialog,
}) {
  const printRef = useRef();

  if (!selectedInvoice) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '', 'height=800,width=800');
    
    printWindow.document.write('<html><head><title>Invoice ' + selectedInvoice.invoiceNumber + '</title>');
    printWindow.document.write(`
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .company-info {
          flex: 1;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-number {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
        }
        .section {
          margin: 20px 0;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th {
          background-color: #f5f5f5;
          padding: 10px;
          text-align: left;
          border-bottom: 2px solid #ddd;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        .text-right {
          text-align: right;
        }
        .totals-section {
          margin-top: 30px;
          float: right;
          width: 300px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .totals-row.total {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #333;
          margin-top: 10px;
          padding-top: 10px;
        }
        .totals-row.balance {
          color: #d32f2f;
          font-weight: bold;
          border-top: 1px solid #ddd;
          margin-top: 5px;
          padding-top: 5px;
        }
        .terms {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-paid { background-color: #4caf50; color: white; }
        .status-sent { background-color: #2196f3; color: white; }
        .status-draft { background-color: #9e9e9e; color: white; }
        .status-overdue { background-color: #f44336; color: white; }
        .status-partial { background-color: #ff9800; color: white; }
        .status-cancelled { background-color: #9e9e9e; color: white; }
        @media print {
          body { padding: 0; }
        }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadPDF = async () => {
    try {
      // Use browser's print to PDF functionality
      const printContent = printRef.current;
      const printWindow = window.open('', '', 'height=800,width=800');
      
      printWindow.document.write('<html><head><title>Invoice ' + selectedInvoice.invoiceNumber + '</title>');
      printWindow.document.write(`
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .company-info { flex: 1; }
          .invoice-info { text-align: right; }
          .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
          }
          .section { margin: 20px 0; }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #555;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th {
            background-color: #f5f5f5;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
          }
          .text-right { text-align: right; }
          .totals-section {
            margin-top: 30px;
            float: right;
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .totals-row.total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
          }
          .totals-row.balance {
            color: #d32f2f;
            font-weight: bold;
            border-top: 1px solid #ddd;
            margin-top: 5px;
            padding-top: 5px;
          }
          .terms {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid { background-color: #4caf50; color: white; }
          .status-sent { background-color: #2196f3; color: white; }
          .status-draft { background-color: #9e9e9e; color: white; }
          .status-overdue { background-color: #f44336; color: white; }
          .status-partial { background-color: #ff9800; color: white; }
          .status-cancelled { background-color: #9e9e9e; color: white; }
        </style>
      `);
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      // Note: User will need to select "Save as PDF" in the print dialog
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try printing instead.');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      PAID: 'status-paid',
      SENT: 'status-sent',
      DRAFT: 'status-draft',
      OVERDUE: 'status-overdue',
      PARTIAL: 'status-partial',
      CANCELLED: 'status-cancelled',
    };
    return statusMap[status] || 'status-draft';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6">Invoice Details</Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedInvoice.invoiceNumber}
          </Typography>
        </Box>
        <Chip
          label={selectedInvoice.status}
          color={getStatusColor(selectedInvoice.status)}
        />
      </DialogTitle>
      <DialogContent>
        {/* Hidden printable content */}
        <Box ref={printRef} sx={{ display: 'none' }}>
          <div className="invoice-header">
            <div className="company-info">
              <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>INVOICE</h1>
              <div style={{ marginTop: '20px' }}>
                <strong>Bill To:</strong><br />
                <strong>{selectedInvoice.customer.companyName}</strong><br />
                {selectedInvoice.customer.streetAddress && (
                  <>{selectedInvoice.customer.streetAddress}<br /></>
                )}
                {selectedInvoice.customer.city && selectedInvoice.customer.province && (
                  <>{selectedInvoice.customer.city}, {selectedInvoice.customer.province}<br /></>
                )}
                {selectedInvoice.customer.postalCode && (
                  <>{selectedInvoice.customer.postalCode}<br /></>
                )}
                {selectedInvoice.customer.email && (
                  <>Email: {selectedInvoice.customer.email}<br /></>
                )}
                {selectedInvoice.customer.phoneNumber && (
                  <>Phone: {selectedInvoice.customer.phoneNumber}</>
                )}
              </div>
            </div>
            <div className="invoice-info">
              <div className="invoice-number">{selectedInvoice.invoiceNumber}</div>
              <div style={{ marginTop: '10px' }}>
                <span className={`status-badge ${getStatusClass(selectedInvoice.status)}`}>
                  {selectedInvoice.status}
                </span>
              </div>
              <div style={{ marginTop: '20px', fontSize: '14px' }}>
                <strong>Invoice Date:</strong> {formatDate(selectedInvoice.invoiceDate)}<br />
                <strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}<br />
                <strong>Billing Period:</strong><br />
                {formatDate(selectedInvoice.billingPeriodStart)} - {formatDate(selectedInvoice.billingPeriodEnd)}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Line Items</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.lineItems?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{formatDate(item.tripDate)}</td>
                    <td className="text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals-section">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(selectedInvoice.subtotal)}</span>
            </div>
            <div className="totals-row">
              <span>Tax ({selectedInvoice.taxRate}%):</span>
              <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
            </div>
            <div className="totals-row total">
              <span>Total:</span>
              <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
            </div>
            <div className="totals-row">
              <span>Amount Paid:</span>
              <span>{formatCurrency(selectedInvoice.amountPaid)}</span>
            </div>
            <div className="totals-row balance">
              <span>Balance Due:</span>
              <span>{formatCurrency(selectedInvoice.balanceDue)}</span>
            </div>
          </div>

          <div style={{ clear: 'both' }}></div>

          {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
            <div className="section" style={{ marginTop: '40px' }}>
              <div className="section-title">Payment History</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td>{payment.paymentMethod.replace('_', ' ')}</td>
                      <td>{payment.referenceNumber || "-"}</td>
                      <td className="text-right">{formatCurrency(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedInvoice.terms && (
            <div className="terms">
              <strong>Terms & Conditions:</strong><br />
              {selectedInvoice.terms}
            </div>
          )}
        </Box>

        {/* Visible dialog content */}
        <Box sx={{ pt: 2 }}>
          {/* Invoice Header */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Customer</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedInvoice.customer.companyName}
                </Typography>
                {selectedInvoice.customer.email && (
                  <Typography variant="body2">{selectedInvoice.customer.email}</Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">Dates</Typography>
                <Typography variant="body2">
                  Invoice: {formatDate(selectedInvoice.invoiceDate)}
                </Typography>
                <Typography variant="body2">
                  Due: {formatDate(selectedInvoice.dueDate)}
                </Typography>
                <Typography variant="body2">
                  Period: {formatDate(selectedInvoice.billingPeriodStart)} - {formatDate(selectedInvoice.billingPeriodEnd)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Line Items */}
          <Typography variant="subtitle2" gutterBottom>Line Items</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedInvoice.lineItems?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{formatDate(item.tripDate)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography>{formatCurrency(selectedInvoice.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Tax ({selectedInvoice.taxRate}%):</Typography>
              <Typography>{formatCurrency(selectedInvoice.taxAmount)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography fontWeight="bold">Total:</Typography>
              <Typography fontWeight="bold">{formatCurrency(selectedInvoice.totalAmount)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography color="success.main">Amount Paid:</Typography>
              <Typography color="success.main">{formatCurrency(selectedInvoice.amountPaid)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: 1, pt: 1, borderColor: "divider" }}>
              <Typography fontWeight="bold" color={selectedInvoice.balanceDue > 0 ? "error" : "success.main"}>
                Balance Due:
              </Typography>
              <Typography fontWeight="bold" color={selectedInvoice.balanceDue > 0 ? "error" : "success.main"}>
                {formatCurrency(selectedInvoice.balanceDue)}
              </Typography>
            </Box>
          </Paper>

          {/* Payments */}
          {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Payment History</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoice.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>
                          <Chip label={payment.paymentMethod.replace('_', ' ')} size="small" />
                        </TableCell>
                        <TableCell>{payment.referenceNumber || "-"}</TableCell>
                        <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Terms */}
          {selectedInvoice.terms && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="textSecondary">Terms & Conditions</Typography>
              <Typography variant="body2">{selectedInvoice.terms}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={handlePrint}
          variant="outlined"
          startIcon={<PrintIcon />}
        >
          Print
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outlined"
          startIcon={<PdfIcon />}
        >
          Download PDF
        </Button>
        {(selectedInvoice.status === "SENT" || selectedInvoice.status === "PARTIAL" || selectedInvoice.status === "OVERDUE") && canMarkPaid && (
          <Button
            onClick={() => {
              onClose();
              handleOpenRecordPaymentDialog(selectedInvoice);
            }}
            variant="contained"
            color="success"
            startIcon={<PaymentIcon />}
          >
            Record Payment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
