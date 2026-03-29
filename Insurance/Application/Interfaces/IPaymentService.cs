using Application.DTOs.Payment;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IPaymentService
    {
        Task<int> PayAndCreatePolicyAsync(int customerId, PaymentRecordDto dto);
    }
}
