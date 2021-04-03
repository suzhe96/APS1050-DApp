pragma solidity ^0.5.12;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        string breed;
        uint age;
        string loc;
        string img;
        uint voteCount;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store accounts that have registered
    mapping(address => bool) public regList;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    event registeredEvent (
        uint indexed candidatesCount 
    );

    constructor () public {
        // Default candidate from pets.json
        addCandidate("Frieda", "Boxer", 3, "Camas, Pennsylvania", "../images/boxer.jpeg");
        addCandidate("Gina", "Scottish Terrier", 3, "Tooleville, West Virginia", "../images/scottish-terrier.jpeg");
    }

    function addCandidate (string memory _name, string memory _breed, uint _age, string memory _loc, string memory _img) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, _breed, _age, _loc, _img, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }

    function register (string memory _name, string memory _breed, uint _age, string memory _loc, string memory _img) public {
        require(!regList[msg.sender]);

        regList[msg.sender] = true;

        addCandidate(_name, _breed, _age, _loc, _img);
        
        emit registeredEvent(candidatesCount);
    }
}
