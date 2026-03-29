using AutoMapper;
using Insurance.Domain.Entities;
using Insurance.Application.DTOs.Common;
using Insurance.Application.DTOs.Policy;
using Insurance.Application.DTOs.Claim;
using System.Security.Claims;

namespace Insurance.Application.Mappings
{
    /// <summary>
    /// Centralized AutoMapper configuration profile.
    /// </summary>
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Role,
                    opt => opt.MapFrom(src => src.Role.ToString()));

            // PolicyProduct mappings
            CreateMap<PolicyProduct, PolicyProductResponse>();

            CreateMap<CreatePolicyProductRequest, PolicyProduct>()
                .ConstructUsing(src => new PolicyProduct(
                    src.Name,
                    src.Description,
                    src.BasePremium,
                    src.CoverageAmount,
                    src.TenureMonths,
                    3 // Default claim limit
                ));

            // Claims mappings
            CreateMap<Insurance.Domain.Entities.Claims, ClaimResponse>()
                .ForMember(dest => dest.Status,
                    opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreateClaimRequest, Insurance.Domain.Entities.Claims>();
        }
    }
}