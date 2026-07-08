package com.library.service;


import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.library.dto.CommunityDTO;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Communities;
import com.library.repository.CommunitiesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // Creates a constructor with all final fields
public class CommunitiesService {
	

    private final CommunitiesRepository communitiesRepository;
    
    @Autowired
    public CommunitiesService(CommunitiesRepository communitiesRepository) {
    	this.communitiesRepository=communitiesRepository;
    }


    public List<Communities> getAllCommunities() {
        return communitiesRepository.findAll();
    }
    
    public Communities getCommunitiesById(Long communityId) {
        return communitiesRepository.findById(communityId).orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + communityId));
    }
    
    
    public Communities createCommunity(CommunityDTO request) {
    	Communities community=new Communities();
    	community.setCommunityId(communitiesRepository.findMaxCommunitiesId()+1);
    	community.setCommunityName(request.getCommunityName());
    	return communitiesRepository.save(community);
    }
    

	public Communities removeCommunity(Long communityId) {
		communitiesRepository.deleteById(communityId);
		return null;
	}
	
	public Long getTotalCommunities() {
		return communitiesRepository.findMaxCommunitiesId();
	}



}
