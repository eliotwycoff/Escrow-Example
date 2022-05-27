// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;

contract Escrow {
	address public arbiter;
	address payable public beneficiary;
	address public depositor;

	enum State {
		DEPLOYED,
		APPROVED,
		REJECTED
	}

	State internal contractState;

	constructor(address _arbiter, address payable _beneficiary) payable {
		arbiter = _arbiter;
		beneficiary = _beneficiary;
		depositor = msg.sender;
		contractState = State.DEPLOYED;
	}

	event Approved(uint);
	event Rejected(uint);

	function approve() arbiterOnly external {
		uint balance = address(this).balance;
		(bool success, ) = beneficiary.call{ value: balance }("");

		if (success) {
			emit Approved(balance);
			contractState = State.APPROVED;
		}
	}

	function reject() arbiterOnly external {
		uint balance = address(this).balance;
		(bool success, ) = depositor.call{ value: balance }("");

		if (success) {
			emit Rejected(balance);
			contractState = State.REJECTED;
		}
	}

	function state() external view returns (string memory) {
		State currentState = contractState;

		if (currentState == State.DEPLOYED) return "Deployed";
		if (currentState == State.APPROVED) return "Approved";
		if (currentState == State.REJECTED) return "Rejected";

		return "";
	}

	modifier arbiterOnly {
		require(msg.sender == arbiter, "Access Denied");
		_;
	}
}
