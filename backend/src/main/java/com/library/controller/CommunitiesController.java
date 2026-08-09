package com.library.controller;


import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.library.dto.CommunityDTO;
import com.library.dto.CommunitySummaryDTO;
import com.library.model.Communities;
import com.library.service.CommunitiesService;
import com.library.service.LibrarySummaryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/communities")
public class CommunitiesController {
	
	 private final CommunitiesService communitiesService;
	 private final LibrarySummaryService librarySummaryService;
	 
	    @Autowired
	    public CommunitiesController(CommunitiesService communitiesService, LibrarySummaryService librarySummaryService) {
	    	this.communitiesService=communitiesService;
	    	this.librarySummaryService=librarySummaryService;
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

    @GetMapping("/{id}/summary")
    public ResponseEntity<CommunitySummaryDTO> getCommunitySummary(@PathVariable(value = "id") Long communityId) {
    	return ResponseEntity.ok(librarySummaryService.getCommunitySummary(communityId));
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
