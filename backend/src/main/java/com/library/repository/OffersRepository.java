package com.library.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.library.model.Offers;

@Repository
public interface OffersRepository extends JpaRepository<Offers, Long> {
    List<Offers> findByCommunityCommunityIdOrderByStartDateDesc(Long communityId);

    List<Offers> findByCommunityCommunityIdAndActiveTrue(Long communityId);

    Optional<Offers> findFirstByCommunityCommunityIdAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long communityId,
            LocalDate startDate,
            LocalDate endDate
    );
}
