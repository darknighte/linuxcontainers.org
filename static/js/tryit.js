$(document).ready(function() {
    var tryit_terms_hash = "";
    var tryit_console = "";
    var tryit_server = "lxd-demo.linuxcontainers.org:8443";

    function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                if (sParameterName[1] === undefined) {
                    return ""
                }

                if (sParameterName[1].substr(-1) === "/") {
                    sParameterName[1] = sParameterName[1].substr(0, sParameterName[1].length - 1);
                }

                return sParameterName[1];
            }
        }

        return ""
    };

    function getTimeRemaining(endtime){
        var current = Math.floor(new Date() / 1000);
        var remaining = endtime - current

        if (remaining < 0) {
            remaining = 0
        }

        return remaining
    }

    function initializeClock(id, endtime) {
        var clock = document.getElementById(id);
        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        function updateClock() {
            var t = getTimeRemaining(endtime);

            var minutes = Math.floor(t / 60)
            var seconds = t - minutes * 60;

            minutesSpan.innerHTML = ('0' + minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + seconds).slice(-2);

            if(t <= 0) {
                clearInterval(timeinterval);
                window.history.back();
                location.reload(true);
            }
        }

        updateClock();
        var timeinterval = setInterval(updateClock, 1000);
    }

    function setupConsole(uuid) {
        var sock = new WebSocket("wss://"+tryit_server+"/1.0/console?uuid="+uuid);

        sock.onopen = function (e) {
            var term = new Terminal({
                cols: 150,
                rows: 20,
                useStyle: true,
                screenKeys: false
            });

            $('#tryit_console_reconnect').css("display", "none")
            term.open(document.getElementById("tryit_console"))

            term.on('data', function(data) {
                sock.send(data);
            });

            sock.onmessage = function(msg) {
                term.write(msg.data);
            };

            sock.onclose = function(msg) {
                term.destroy();
                $('#tryit_console_reconnect').css("display", "inherit");
            };
        };
    }

    tryit_console = getUrlParameter("id");

    if (tryit_console == "") {
        $('#tryit_info_panel').css("display", "none")
        $('#tryit_console_panel').css("display", "none")
        $('#tryit_examples_panel').css("display", "none")
        $('#tryit_progress').css("display", "none")

        $.ajax({
            url: "https://"+tryit_server+"/1.0"
        }).then(function(data) {
            if (data.server_console_only == true) {
                $('#tryit_ssh_row').css("display", "none");
                $('#tryit_lxd_row').css("display", "none");
            }

            $('#tryit_protocol').text(data.client_protocol);
            $('#tryit_address').text(data.client_address);
            $('#tryit_count').text(data.containers_count);
            $('#tryit_max').text(data.containers_max);
        });

        $.ajax({
            url: "https://"+tryit_server+"/1.0/terms"
        }).then(function(data) {
            tryit = data;
            $('#tryit_terms').html(data.terms);
            tryit_terms_hash = data.hash;
        });
    } else {
        $('#tryit_status_panel').css("display", "none");
        $('#tryit_terms_panel').css("display", "none");
        $('#tryit_start_panel').css("display", "none");
        $('#tryit_info_panel').css("display", "none");
        $('#tryit_console_panel').css("display", "inherit");
        $('#tryit_examples_panel').css("display", "inherit");

        setupConsole(tryit_console)
    }

    $('#tryit_accept').click(function() {
        $('#tryit_terms_panel').css("display", "none");
        $('#tryit_accept').css("display", "none");
        $('#tryit_progress').css("display", "inherit");

        $.ajax({
            url: "https://"+tryit_server+"/1.0/start?terms="+tryit_terms_hash
        }).then(function(data) {
            $('.tryit_container_console').html(data.console);
            $('.tryit_container_ip').html(data.ip);
            $('.tryit_container_fqdn').text(data.fqdn);
            $('.tryit_container_username').html(data.username);
            $('.tryit_container_password').html(data.password);
            initializeClock('tryit_clock', data.expiry);

            $('#tryit_status_panel').css("display", "none");
            $('#tryit_start_panel').css("display", "none");
            $('#tryit_info_panel').css("display", "inherit");
            $('#tryit_console_panel').css("display", "inherit");
            $('#tryit_examples_panel').css("display", "inherit");

            tryit_console = data.console
            window.history.pushState("", "", "?id="+tryit_console);
            setupConsole(tryit_console)
        });
    });

    $('#tryit_console_reconnect').click(function() {
        setupConsole(tryit_console)
    });
});