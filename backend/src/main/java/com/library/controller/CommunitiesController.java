package com.library.controller;


import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.dto.CommunityDTO;
import com.library.model.Communities;
import com.library.repository.CommunitiesRepository;
import com.library.service.CommunitiesService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/communities")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allows your React app to call the API
public class CommunitiesController {
	
	 private final CommunitiesService communitiesService;
	 
	    @Autowired
	    public CommunitiesController(CommunitiesService communitiesService) {
	    	this.communitiesService=communitiesService;
	    }
    
	 // Get all communities
    @GetMapping
    public List<Communities> getAllCommunities() {
        return communitiesService.getAllCommunities();
    }
    
    // Get a single community by ID
    @GetMapping("/{id}")
    public ResponseEntity<Communities> getCommunitiesById(@PathVariable(value = "id") Long communityId) {
    	Communities communities = communitiesService.getCommunitiesById(communityId);
        return ResponseEntity.ok().body(communities);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getTotalCommunities() {
        return ResponseEntity.ok().body(communitiesService.getTotalCommunities());
    }
    
    @PostMapping
    public Communities createCommunity(@Valid @RequestBody CommunityDTO request){
    	return communitiesService.createCommunity(request);
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Communities> removeCommunitiesById(@PathVariable(value = "id") Long communityId) {
    	return ResponseEntity.ok().body(communitiesService.removeCommunity(communityId));
    }
    
   

}
