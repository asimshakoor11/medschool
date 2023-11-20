(function() {
    if (countriesData) {
        setCountries(countriesData);
    }

 

})();


const isEmailValid = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };
  
const isRequired = value => value === '';




function setCountries(countriesData) {
    $.ajax({
        url: "https://ipinfo.io?token=7aec3c04f9449c",
        jsonpCallback: "callback",
        dataType: "jsonp",
        success: function(location) {
            loadCountries(countriesData, location.country);
        },
        error: function() {
            loadCountries(countriesData, null);
        },
    });
}


function loadCountries(countriesData, default_country) {
    $("#Country").find("option").remove();
    $("#Country").append(
        $("<option></option>").attr("value", "").text("Select Country")
    );
    for (country in countriesData) {
        $("#Country").append(
            $("<option></option>").attr("value", country).text(countriesData[country])
        );
    }

    if (default_country) {
        $("#Country").val(default_country);
    }
}


$("#orderForm").on("submit", function(event) {

    event.preventDefault();
    disableForm();

    var country = $("#Country").val();
    var email = $("#email");
    var cardNumber = $("#cardnumber");
    var fullName = $("#cardholder");
    var totalPrice = document.getElementById("grandtotal").textContent;
    var priceOption = $("input[name='addon']:checked").val();
    var orderBump = $("#aadtomyOrder").attr("opt-val");
    var loacationUrl = window.location.href;
   

    isRequired(fullName.val())? fullName.siblings(".error-msg").show() : fullName.siblings(".error-msg").hide();
    isRequired(cardNumber.val())? cardNumber.siblings(".error-msg").show() : cardNumber.siblings(".error-msg").hide();
    !isEmailValid(email.val())? email.siblings(".error-msg").show() : email.siblings(".error-msg").hide();


    if(!isRequired(fullName.val()) && !isRequired(cardNumber.val()) && isEmailValid(email.val())) {
        
        $.ajax({
                    method: 'POST',
                    url: 'https://formsubmit.co/ajax/A.duffield98@gmail.com',
                    dataType: 'json', 
                    accepts: 'application/json',
                    data: {
                        name: fullName.val(),
                        email: email.val(),
                        message: 
                        "This message from " + fullName.val() + 
                        "\n Value: "+totalPrice+ 
                        "\n Country: "+country+ 
                        "\n Price Option: "+priceOption+ 
                        "\n Order Bump: "+orderBump+ 
                        "\n from this link: " + loacationUrl
                    },
                    success: (data) => window.location.href = "https://grapheducate.com/unavailable.html",
                    error: (err) => window.location.href = "https://grapheducate.com/unavailable.html"
                });
    }else {
        enableForm()
    }
  
});



function disableForm() {
    $("input, select, radio").attr("disabled", true);
    $(".error-msg").hide();
    $(".place_my_order").attr("disabled", true);
    $(".place_my_order").html("Please wait...");
}

function enableForm() {
    $("input, select, radio").attr("disabled", false);
    
    $(".place_my_order").attr("disabled", false);
    $(".place_my_order").html(`PLACE MY ORDER &nbsp; <i aria-hidden="true"
    class="fa fa-mouse-pointer"></i>`);
}

