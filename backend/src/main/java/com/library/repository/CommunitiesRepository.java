package com.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.model.Communities;

@Repository
public interface CommunitiesRepository extends JpaRepository<Communities, Long> {
	// TODO Auto-generated constructor stub
	
	@Query(value = "SELECT max(community_Id) trimmed FROM COMMUNITIES", nativeQuery = true)
	Long findMaxCommunitiesId();

}
