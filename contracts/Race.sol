pragma solidity 0.4.24;


contract Race {
    
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
    address[] playerAddresses;
    bool[] readyPlayers;
    
    mapping(address => Player) players;
  }
    
  struct RunningTrack {
    uint startTime;
  }
  
  mapping(bytes32 => Track) public tracks;
  
  mapping(bytes32 => RunningTrack) public runningTracks;
  
  modifier onlyFreeTrack(bytes32 _trackId) {
    require(tracks[_trackId].playerAddresses.length < 2);
    _;
  }

  event DebugUint(uint i);
  event DebugBytes(bytes32 b);

  function createTrack(bytes32 id) external {
    require(tracks[id].numPlayers == 0);

    tracks[id] = createEmptyTrack();
    Track storage t = tracks[id];
    addPlayer(t, createPlayer(msg.sender, t.playerAddresses.length));
  }
  
  function getCountPlayerByTrackId(bytes32 _id) public view returns (uint) {
    return tracks[_id].playerAddresses.length;
  }
  
  function getCountReadyPlayerByTrackId(bytes32 _id) public view returns (uint) {
    return tracks[_id].readyCount;
  }
  
  function getTrackOwner(bytes32 _id) public view returns (address) {
    return tracks[_id].players[tracks[_id].playerAddresses[0]].addr;
  }
  
  function getPlayersByTrackId(bytes32 _id) public view returns (address[]) {
    address[] memory a = new address[](tracks[_id].playerAddresses.length);
      
    for (uint i = 0; i < tracks[_id].playerAddresses.length; i++) {
      a[i] = (tracks[_id].playerAddresses[i]);
    }
      
    return a;
  }
  
  function joinToTrack(bytes32 _id) public onlyFreeTrack(_id) {
    Track storage t = tracks[_id];
      
    require(!(t.players[msg.sender].addr == msg.sender));
    require(!isReadyToStart(_id));
      
    addPlayer(t, createPlayer(msg.sender, t.playerAddresses.length));
  }
  
  function setPortfolio(bytes32 _trackId, bytes32[] names, uint[] values) external {
    require(names.length == values.length);
    require(!isReadyToStart(_trackId));
      
    Track storage t = tracks[_trackId];
    Player storage p = t.players[msg.sender];
    p.portfolioElements = 0; 
      
    uint totalPercent = 0;
    for (uint i = 0; i < names.length; i++) {
      require(values[i] > 0 && values[i] <= 100);
      require(!isNameExists(p.portfolioIndex, names[i], p.portfolioElements));
          
      p.portfolioIndex.push(names[i]);
      p.portfolio[names[i]] = values[i];
      p.portfolioElements++;
      totalPercent += values[i];
      require(totalPercent <= 100);
    }
      
    if (!t.readyPlayers[p.id]) {
      t.readyCount++;
      t.readyPlayers[p.id] = true;
    }
      
    if (tracks[_trackId].readyCount == tracks[_trackId].numPlayers) {
      runningTracks[_trackId] = RunningTrack({startTime: now + (5 - (now % 5))});
    }
  }

  function getPortfolio(bytes32 _trackId, address _addr) public view returns (bytes32[], uint[]) {
    bytes32[] memory n = new bytes32[](tracks[_trackId].players[_addr].portfolioElements);
    uint[] memory v = new uint[](tracks[_trackId].players[_addr].portfolioElements);
      
    for (uint i = 0; i < tracks[_trackId].players[_addr].portfolioElements; i++) {
      n[i] = tracks[_trackId].players[_addr].portfolioIndex[i];
      v[i] = tracks[_trackId].players[_addr].portfolio[n[i]];
    }
      
    return(n, v);
  }
  
  function isReadyToStart(bytes32 _trackId) public view returns (bool) {
    Track storage t = tracks[_trackId];
    
    return t.readyCount == t.numPlayers;
  }
  
  function isEndedTrack(bytes32 _trackId) public view returns (bool) {
    Track storage t = tracks[_trackId];
    return now > runningTracks[_trackId].startTime + t.duration;
  }

  function endTime(bytes32 _trackId) public view returns (uint) {
    Track storage t = tracks[_trackId];
    return runningTracks[_trackId].startTime + t.duration;
  }

  function getPlayers(bytes32 _trackId) public view returns(address[]) {
    return tracks[_trackId].playerAddresses;
  }

  function isNameExists(bytes32[] storage names, bytes32 name, uint numNames) internal view returns (bool) {
    for (uint i = 0; i < numNames; i++) {
      if (names[i] == name) {
        return true;
      }
    }
      
    return false;
  }
  
  function createEmptyTrack() internal view returns (Track) {
    return Track({
      playerAddresses: new address[](0),
      readyCount: 0,
      readyPlayers: new bool[](0),
      duration: 5 minutes,
      numPlayers: 2
    });
  }
  
  function createPlayer(address _addr, uint _id) internal pure returns (Player) {
    return Player({addr: _addr, portfolioIndex: new bytes32[](0), portfolioElements: 0, id: _id});
  }
  
  function addPlayer(Track storage t, Player p) internal {
    t.players[p.addr] = p;
    t.playerAddresses.push(p.addr);
    t.readyPlayers.push(false);
  }
}