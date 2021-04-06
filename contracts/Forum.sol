pragma solidity ^0.5.12;

contract Forum {
    // Model a post
    struct Post {
        uint id;
        string contents;
        address payable owner;
        string time;
    }

    // Store Post
    // Fetch Post
    mapping(uint => Post) public posts;
    // Store Post Count
    uint public postCount;


    event postEvent (
        uint indexed postCount 
    );

    constructor () public {
        // Default candidate from pets.json
        addPost("Dummy Comments", "timestamp");
    }

    function addPost (string memory _contents, string memory _time) private {
        postCount ++;
        posts[postCount] = Post(postCount, _contents, msg.sender, _time);
    }

    function comment (string memory _contents, string memory _time) public {
        addPost(_contents, _time);
        
        emit postEvent(postCount);
    }
}
