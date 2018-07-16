pragma solidity 0.4.24;

contract RaceCore {
    
  struct Player {
    uint id;
    uint portfolioElements;
    address addr;
    bytes32[] portfolioIndex;
        
    mapping(bytes32 => uint) portfolio;
  }
    
  struct Track {
    uint readyCount;
    uint duration;
    uint numPlayers;
    uint betAmount;
    address[] playerAddresses;
    bool[] readyPlayers;
    
    mapping(address => Player) players;
  }
    
  struct RunningTrack {
    uint startTime;
  }
  
  mapping(bytes32 => Track) public tracks;
  mapping(bytes32 => mapping(address => uint)) public deposites;
  mapping(bytes32 => RunningTrack) public runningTracks;
}