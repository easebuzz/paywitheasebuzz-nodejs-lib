jQuery(document).ready(function() {

    // Redirect to html page based on API Call
    jQuery('.tabs a').on('click', function(e) {
        e.preventDefault();
        switch (this.parentNode.id) {
            // -----^-- get parent node and it's id

            case "initiate_payment_tab":
                window.location.href = "view/initiate_payment.html";
            break;

            case "transaction_tab":
                window.location.href = "view/transaction.html";
            break;

            case "transaction_date_tab":
                window.location.href = "view/transaction_date.html";
            break;

            case "refund_tab":
                window.location.href = "view/refund.html";
            break;

            case "payout_tab":
                window.location.href = "view/payout.html";
            break;
        }
    });
    
});

// Set date picker on UI
$(function(){
    $("#transaction_date").datepicker({ dateFormat: 'dd-mm-yy' });
    $("#payout_date").datepicker({ dateFormat: 'dd-mm-yy' });
});