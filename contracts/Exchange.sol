// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "./Token.sol";

contract Exchange{
    address public feeAccount;
    uint256 public percent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => order) public orders;
    mapping(uint256 => bool) public cancelOrders;
    uint256 public orderCount;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address giveToken, uint256 giveValue, address getToken, uint256 getValue, uint256 timestamp);
    event CancelOrder(uint256 id, address user, address giveToken, uint256 giveValue, address getToken, uint256 getValue, uint256 timestamp);

    constructor(address _feeAccount,uint256 _percent){
        feeAccount = _feeAccount;
        percent = _percent;
    }

    struct order{
        uint256 id;
        address user;
        address giveToken;
        uint256 giveValue;
        address getToken;
        uint256 getValue;
        uint256 timestamp;
    }

    function depositToken(address _token,uint256 amount) public{
        Token(_token).transferFrom(msg.sender, address(this), amount);
        tokens[_token][msg.sender]+= amount;
        emit Deposit(_token, msg.sender, amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token,uint256 amount) public{
        Token(_token).transfer(msg.sender, amount);
        tokens[_token][msg.sender]-= amount;
        emit Withdraw(_token, msg.sender, amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns(uint256 balance){
        return tokens[_token][_user];
    }

    function makeOrder(address _giveToken,uint256 _giveValue, address _getToken, uint256 _getValue) public {
        require(tokens[_giveToken][msg.sender]>=_giveValue);
        orderCount++;
        orders[orderCount] = order(orderCount,msg.sender,_giveToken,_giveValue,_getToken,_getValue,block.timestamp);
        emit Order(orderCount,msg.sender,_giveToken,_giveValue,_getToken,_getValue,block.timestamp);
    }

    function cancelOrder(uint256 _id) public{
        order storage o = orders[_id];
        require(o.id==_id);
        cancelOrders[_id] = true;
        emit CancelOrder(_id,msg.sender,o.giveToken,o.giveValue,o.getToken,o.getValue,block.timestamp);
    }
}