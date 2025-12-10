

const form = document.querySelector("form");
const message = document.querySelector("span");

const namePatt = /^[a-z ,.'-]+$/i
const emailPatt = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
let msgPatt =/.{2,300}$/;          
                

form.addEventListener("submit", e=>{
    event.preventDefault();

    let nameRes = namePatt.test(form.inqName.value);
    let emailRes = emailPatt.test(form.email.value);
    let msgRes = msgPatt.test(form.msg.value);

    console.log(nameRes, emailRes, msgRes);

    if(nameRes && emailRes & msgRes ){
                    console.log("Submit success");
                    message.innerHTML="Form submitted";
                    message.setAttribute("class","formSuccess");
                } else {
                    console.log("Error");
                    message.textContent="Error: inputs in red boxes indicate an incorrect entry";
                    message.setAttribute("class", "formError");
                }

})

inqName.addEventListener("keyup", e=>{
    let nameRes = namePatt.test(event.target.value);
            if(nameRes){
                form.inqName.setAttribute("class","inputSuccess");
            } else{
                form.inqName.setAttribute("class","inputError");
            }
})

email.addEventListener("keyup", e=>{
    let emailRes = emailPatt.test(event.target.value);
            if(emailRes){
                form.email.setAttribute("class","inputSuccess");
            } else{
                form.email.setAttribute("class","inputError");
            }
})

msg.addEventListener("keyup", e=>{
    let emailRes = emailPatt.test(event.target.value);
            if(msgRes){
                form.msg.setAttribute("class","inputSuccess");
            } else{
                form.msg.setAttribute("class","inputError");
            }
})

