using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Insurance.Application.DTOs.Policy;
using Application.Interfaces;
using AutoMapper;
using Insurance.Domain.Entities;

namespace Application.Services
{
    public class PolicyProductService
    {
        private readonly IPolicyProductRepository _repository;
        private readonly IMapper _mapper;

        public PolicyProductService(
            IPolicyProductRepository repository,
            IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PolicyProductResponse> CreateAsync(
            CreatePolicyProductRequest dto)
        {
            var product = _mapper.Map<PolicyProduct>(dto);

            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();

            return _mapper.Map<PolicyProductResponse>(product);
        }

        public async Task<List<PolicyProductResponse>> GetAllAsync()
        {
            var products = await _repository.GetAllAsync();
            return _mapper.Map<List<PolicyProductResponse>>(products);
        }

        public async Task<List<PolicyProductResponse>> GetActiveAsync()
        {
            var products = await _repository.GetActiveAsync();
            return _mapper.Map<List<PolicyProductResponse>>(products);
        }

        public async Task<PolicyProductResponse> UpdateAsync(int id, CreatePolicyProductRequest dto)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null)
                throw new Exception("Policy product not found");

            // Update properties
            product.Update(
                dto.Name,
                dto.Description,
                dto.BasePremium,
                dto.CoverageAmount,
                dto.TenureMonths
            );

            if (dto.IsActive.HasValue)
            {
                if (dto.IsActive.Value)
                    product.Activate();
                else
                    product.Deactivate();
            }

            await _repository.SaveChangesAsync();

            return _mapper.Map<PolicyProductResponse>(product);
        }

        public async Task DeleteAsync(int id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null)
                throw new Exception("Policy product not found");

            await _repository.DeleteAsync(product);
            await _repository.SaveChangesAsync();
        }
    }
}
