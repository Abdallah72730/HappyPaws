$(function () {

  /* ------------------------------
     TABS
  ------------------------------ */
  $("#tabs").tabs();


  /* ------------------------------
     ACCORDION
  ------------------------------ */
  $("#pricing-accordion").accordion({
    collapsible: true,
    heightStyle: "content",
  });


  /* ------------------------------
     PRICE TABLES
  ------------------------------ */
  const dogWalkingPrices = { 30: 15, 60: 30, 90: 45, 120: 60 };
  const groomingPrices = { basic: 40, full: 60, deluxe: 80 };
  const veterinaryPrices = { checkup: 60, vaccination: 80, surgery: 150 };


  /* ------------------------------
     DATEPICKER (with min/max)
  ------------------------------ */
  $("#dog-walking-date, #pet-grooming-date, #veterinary-date").datepicker({
    minDate: 0,
    maxDate: "+30D",
    dateFormat: "yy-mm-dd",
  });


  /* ------------------------------
     GRAND TOTAL CALCULATION
  ------------------------------ */
  function recalculateGrandTotal() {
    let grandTotal = 0;
    $("#services-table tbody tr").each(function () {
      grandTotal += parseFloat($(this).find("td.total-price").text().replace("$", "")) || 0;
    });
    $("#grand-total").text("$" + grandTotal);
    $("#place-order").prop("disabled", grandTotal === 0);
  }


  /* ------------------------------
     UPDATE SERVICE ROW
  ------------------------------ */
  function updateService(selectId, typeVal, qtyVal, dateVal, unitPriceData, priceSpanId, serviceName) {

    let unitPrice = unitPriceData[typeVal] || 0;
    let totalPrice = unitPrice * qtyVal;

    $("#" + priceSpanId).text(unitPrice > 0 ? totalPrice : "");

    let tbody = $("#services-table tbody");
    tbody.find(`tr[data-service="${serviceName}"]`).remove();

    if (unitPrice > 0 && qtyVal > 0 && typeVal && dateVal) {
      let row = `
        <tr data-service="${serviceName}">
          <td>${serviceName}</td>
          <td>${typeVal}</td>
          <td>${dateVal}</td>
          <td>${qtyVal}</td>
          <td>$${unitPrice}</td>
          <td class="total-price">$${totalPrice}</td>
          <td><button class="delete-service">Delete</button></td>
        </tr>`;
      tbody.append(row);
    }

    tbody.find(".delete-service").off("click").on("click", function () {
      $(this).closest("tr").remove();
      recalculateGrandTotal();
    });

    recalculateGrandTotal();
  }


  /* ------------------------------
     BIND SERVICE EVENTS
  ------------------------------ */
  function bindServiceEvents(service) {
    const { selectId, qtyId, dateId, unitPriceData, priceSpanId, serviceName } = service;

    $("#" + selectId + ", #" + qtyId + ", #" + dateId).on("change keyup", function () {
      const typeVal = $("#" + selectId).val();
      const qtyVal = parseInt($("#" + qtyId).val()) || 0;
      const dateVal = $("#" + dateId).val();

      updateService(selectId, typeVal, qtyVal, dateVal, unitPriceData, priceSpanId, serviceName);
    });
  }

  bindServiceEvents({
    selectId: "dog-walking-duration",
    qtyId: "dog-walking-qty",
    dateId: "dog-walking-date",
    unitPriceData: dogWalkingPrices,
    priceSpanId: "dog-walking-price",
    serviceName: "Dog Walking",
  });

  bindServiceEvents({
    selectId: "pet-grooming-type",
    qtyId: "pet-grooming-qty",
    dateId: "pet-grooming-date",
    unitPriceData: groomingPrices,
    priceSpanId: "pet-grooming-price",
    serviceName: "Pet Grooming",
  });

  bindServiceEvents({
    selectId: "veterinary-type",
    qtyId: "veterinary-qty",
    dateId: "veterinary-date",
    unitPriceData: veterinaryPrices,
    priceSpanId: "veterinary-price",
    serviceName: "Veterinary",
  });


  /* ------------------------------
     VALIDATE DATE INPUT
  ------------------------------ */
  function validateAllDates() {
    let valid = true;

    $("#dog-walking-date, #pet-grooming-date, #veterinary-date").each(function () {
      let date = $(this).datepicker("getDate");

      // If user typed something invalid manually
      if (date === null && $(this).val().trim() !== "") {
        alert("Invalid date entered: " + $(this).val());
        valid = false;
        return false;
      }
    });

    return valid;
  }


  /* ------------------------------
     PLACE ORDER
  ------------------------------ */
  $("#place-order").click(function () {

    const tbody = $("#services-table tbody");

    if (tbody.find("tr").length === 0) {
      alert("Please select at least one service.");
      return;
    }

    if (!validateAllDates()) return;

    const orderId = "order-" + new Date().getTime();

    let orderTbodyHtml = "";
    tbody.find("tr").each(function () {
      orderTbodyHtml += `
        <tr>
          <td>${$(this).find("td").eq(0).text()}</td>
          <td>${$(this).find("td").eq(1).text()}</td>
          <td>${$(this).find("td").eq(2).text()}</td>
          <td>${$(this).find("td").eq(3).text()}</td>
          <td>${$(this).find("td").eq(4).text()}</td>
          <td>${$(this).find("td").eq(5).text()}</td>
        </tr>`;
    });

    const orderDiv = $(`
      <div class="order-card" id="${orderId}" style="border:2px solid #1E90FF; padding:15px; margin-bottom:20px; border-radius:8px; background:#f0f8ff;">
        <h3 style="color:#1E90FF;">Order #${orderId}</h3>

        <table style="width:100%; text-align:center; border-collapse: collapse;">
          <thead style="background:#87CEFA; color:white;">
            <tr>
              <th>Service</th>
              <th>Option</th>
              <th>Date</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${orderTbodyHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align:right; font-weight:bold;">Total:</td>
              <td>${$("#grand-total").text()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="progress-bar-container" style="background:#ddd; height:25px; border-radius:5px; margin-top:10px;">
          <div class="progress-bar" style="width:0%; background:#1E90FF; height:100%; border-radius:5px;"></div>
          <span class="progress-text" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); color:white; font-weight:bold;">Pending</span>
        </div>
      </div>
    `);

    $("#orders-history").prepend(orderDiv);
    refreshOrderIdCombo();

    $("#orders-history .order-card").each(function (i) {
      $(this).toggleClass("hidden-order", i >= 5);
    });


    /* Reset form visually */
    tbody.empty();
    $("#grand-total").text("$0");
    $("#pricing-accordion select").val("");
    $("#pricing-accordion input[type='number']").val("1");
    $("#pricing-accordion input[type='text']").val("");
    $("span[id$='-price']").text("");
    $("#place-order").prop("disabled", true);


    /* Progress simulation */
    const statuses = [
      { text: "Pending", color: "#1E90FF" },
      { text: "Confirm", color: "#00CED1" },
      { text: "In Service", color: "#006effff" },
      { text: "Completed", color: "#32CD32" },
    ];

    let step = 0;
    const bar = orderDiv.find(".progress-bar");
    const label = orderDiv.find(".progress-text");

    const interval = setInterval(() => {
      step++;

      if (step >= statuses.length) {
        clearInterval(interval);
        bar.css("width", "100%");
        label.text("Completed");
        bar.css("background", statuses[3].color);

        $("#reviews").show();
        return;
      }

      const percent = (step / (statuses.length - 1)) * 100;
      bar.css("width", percent + "%");
      bar.css("background", statuses[step].color);
      label.text(statuses[step].text);

    }, 1000);
  });


  /* ------------------------------
     REFRESH ORDER ID DROPDOWN
  ------------------------------ */
  function refreshOrderIdCombo() {
    $("#orderIdCombo").empty();
    $("#orders-history .order-card").each(function () {
      $("#orderIdCombo").append(`<option value="${$(this).attr("id")}">${$(this).attr("id")}</option>`);
    });
  }


  /* ------------------------------
     TESTIMONIAL SLIDESHOW
  ------------------------------ */
  let testimonials = $("#testimonials .testimonial");
  let tIndex = 0;
  setInterval(function () {
    $(testimonials[tIndex]).fadeOut(800, function () {
      tIndex = (tIndex + 1) % testimonials.length;
      $(testimonials[tIndex]).fadeIn(800);
    });
  }, 4000);


  /* ------------------------------
     CONTACT DIALOG
  ------------------------------ */
  $("#contact-btn").click(function () {
    $("#dialog").dialog();
  });


  /* ------------------------------
     STAR RATING
  ------------------------------ */
  let savedScore = 0;

  $(".star").on("mouseenter", function () {
    let value = $(this).data("value");

    $(".star").each(function () {
      $(this).toggleClass("hovered", $(this).data("value") <= value);
    });
  });

  $(".star").on("mouseleave", function () {
    $(".star").removeClass("hovered");
  });

  $(".star").on("click", function () {
    let value = $(this).data("value");
    savedScore = value;

    $(".star").each(function () {
      let active = $(this).data("value") <= value;
      $(this).toggleClass("filled", active);
      $(this).text(active ? "★" : "☆");
    });
  });

  function returnStarString(score) {
    let s = "";
    for (let i = 0; i < 5; i++) s += (i < score ? "★" : "☆");
    return s;
  }


  /* ------------------------------
     REVIEW FORM
  ------------------------------ */
  const reviewContainer = $("#reviews-list");
  const form = $("#review-form");

  form.on("submit", function (e) {
    e.preventDefault();

    alert("Thank you for your review!");

    const selectedOrderId = $("#orderIdCombo").val();
    const name = $("#reviewer-name").val();
    const reviewText = $("#review-text").val();

    const reviewHtml = `
      <div class="review" style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; background:#f9f9f9;">
        <h2>${selectedOrderId}</h2>
        <h4>${name}</h4>
        <p>${reviewText}</p>
        <p>Rating: ${returnStarString(savedScore)}</p>
      </div>`;

    reviewContainer.prepend(reviewHtml);

    $("#reviews-list .review").each(function (i) {
      $(this).toggleClass("hidden-order", i >= 5);
    });

    form[0].reset();
    savedScore = 0;

    $(".star").text("☆").removeClass("filled");

  });

});
