import {ethers} from 'ethers';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';
import "./index.scss";

const provider = new ethers.providers.Web3Provider(ethereum);

/* DEPLOY A NEW CONTRACT */
document.getElementById("deploy").addEventListener("click", async () => {
  // Deploy a new contract from the supplied parameters.
  await ethereum.request({ method: 'eth_requestAccounts' });
  const beneficiary = document.getElementById("beneficiary").value;
  const arbiter = document.getElementById("arbiter").value;
  const ethValue = document.getElementById("ethValue").value;
  const weiValue = ethers.utils.parseEther(ethValue);
  const signer = provider.getSigner();
  const factory = new ethers.ContractFactory(Escrow.abi, Escrow.bytecode, signer);
  const contract = await factory.deploy(arbiter, beneficiary, { value: weiValue });
  await contract.deployTransaction.wait();

  // Update the UI.
  document.getElementById("contractAddress").value = contract.address;
  populateUI(contract);
});

/* FETCH AN EXISTING CONTRACT */
document.getElementById("contractAddress").addEventListener("input", async (e) => {
  const address = e.target.value;

  if (ethers.utils.isAddress(address)) {
    // If the input string is a valid address, get contract information from it.
    const signer = provider.getSigner();
    const contract = new ethers.Contract(address, Escrow.abi, signer);
    
    // Asynchronously fill the UI with the depositor, arbiter and beneficiary addresses,
    // as well as the contract's balance and state (Deployed, Approved or Rejected).
    populateUI(contract);

  } else {
    // The input string is not a valid address, so prompt the user to correct this mistake.
    document.getElementById("container").innerHTML = "Please input a valid address.";
  }
});

// Since we sometimes can't get elements that've been dynamically added,
// this helper function allows us to fetch an element once it's been rendered,
// and then it process it via the given callback function.
const setElement = (elementId, callback) => {
  const element = document.getElementById(elementId);

  if (element) {
    callback(element);
  } else {
    window.requestAnimationFrame(() => {
      setElement(elementId, callback);
    });
  }
}

function populateUI(contract) {
  const container = document.getElementById("container");

  container.innerHTML = `
    <div class="existing-contract">
      <ul class="fields">
        <li>
          <div class="tag"> Depositor </div>
          <div id="depositor-info"></div>
        </li>
        <li>
          <div class="tag"> Arbiter </div>
          <div id="arbiter-info"></div>
        </li>
        <li>
          <div class="tag"> Beneficiary </div>
          <div id="beneficiary-info"></div>
        </li>
        <li>
          <div class="tag"> Value </div>
          <div id="value-info"></div>
        </li>
        <li id="action-container" class="action-container">
        </li>
      </ul>
    </div>
  `;

  const contractDataError = (error) => {
    console.log(error);
    container.innerHTML = "Please input a valid contract address.";
  };

  contract.depositor()
    .then((address) => {
      setElement("depositor-info", (element) => {
        element.textContent = address;
      });
    })
    .catch(contractDataError);

  contract.arbiter()
    .then((address) => {
      setElement("arbiter-info", (element) => {
        element.textContent = address;
      });
    })
    .catch(contractDataError);

  contract.beneficiary()
    .then((address) => {
      setElement("beneficiary-info", (element) => {
        element.textContent = address;
      });
    })
    .catch(contractDataError);
  
  provider.getBalance(contract.address)
    .then((balance) => {
      setElement("value-info", (element) => {
        element.textContent = `${ethers.utils.formatEther(balance)} ETH`;
      });
    })
    .catch(contractDataError);

  contract.state()
    .then((state) => {
      const approveId = `${contract.address}-approve`;
      const rejectId = `${contract.address}-reject`;
      setElement("action-container", (element) => {
        element.innerHTML = actionButtons(approveId, rejectId, state);
        bindActionButtonHandlers(contract, approveId, rejectId);
      });      
    })
    .catch(contractDataError);
}

function actionButtons(approveId, rejectId, state) {
  if (state === "Deployed") {
    return `
      <div class="error-message" id="action-error"></div>
      <div class="button" id="${approveId}">Approve</div>
      <div class="button button-reject" id="${rejectId}">Reject</div>
    `;
  } else if (state === "Approved") {
    return `<div class="approved">✓ Approved!</div>`;
  } else if (state === "Rejected") {
    return `<div class="rejected">Rejected!</div>`;
  }
}

function bindActionButtonHandlers(contract, approveId, rejectId) {
  const setErrorMessage = (error) => {
    document.getElementById("action-error").textContent = "This function is only available to the Arbiter.";
  };

  setElement(approveId, (element) => {
    element.addEventListener("click", async () => {
      const signer = provider.getSigner();
      contract.connect(signer).approve()
        .catch(setErrorMessage);
    });
  });

  setElement(rejectId, (element) => {
    element.addEventListener("click", async () => {
      const signer = provider.getSigner();
      contract.connect(signer).reject()
        .catch(setErrorMessage);
    });
  });

  contract.on('Approved', () => {
    document.getElementById("action-container").innerHTML = actionButtons(approveId, rejectId, 'Approved');
  });

  contract.on('Rejected', () => {
    document.getElementById("action-container").innerHTML = actionButtons(approveId, rejectId, 'Rejected');
  });
}

